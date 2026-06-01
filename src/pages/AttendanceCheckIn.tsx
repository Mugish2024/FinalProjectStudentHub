import { useEffect, useMemo, useRef, useState } from 'react';
import {
    ChevronLeft,
    QrCode,
    Wifi,
    Fingerprint,
    MapPin,
    ShieldCheck,
    CheckCircle2,
    BedSingle,
    ChevronDown,
    Info,
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import masoroCampus from '../assets/masoro-campus.png';
import './AttendanceCheckIn.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8082';

type AttendanceSession = {
    id: number;
    title: string;
    campus: string;
    startsAt: string;
    endsAt: string;
    active: boolean;
};

type CheckInMethod = 'biometric' | 'wifi' | 'qr' | null;
type ScannerState = 'idle' | 'starting' | 'active' | 'scanned' | 'unsupported' | 'error';

type BarcodeLike = {
    rawValue?: string;
};

type BarcodeDetectorLike = {
    detect: (source: ImageBitmapSource) => Promise<BarcodeLike[]>;
};

type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => BarcodeDetectorLike;

interface AttendanceCheckInProps {
    studentNumber: string;
    initialSessionId?: number;
    initialQrToken?: string;
    onBack: () => void;
}

const CAMPUS_GEOFENCE = {
    gishushu: { lat: -1.9559, lng: 30.1041, radiusMeters: 2000 },
    masoro: { lat: -1.9452, lng: 30.1431, radiusMeters: 2000 },
};

const MAX_ACCEPTABLE_LOCATION_ACCURACY_METERS = 2000;

const getBarcodeDetector = (): BarcodeDetectorCtor | null => {
    const detector = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
    return detector ?? null;
};

const scannerRegionId = 'attendance-qr-reader';

const AttendanceCheckIn = ({ studentNumber, initialSessionId, initialQrToken = '', onBack }: AttendanceCheckInProps) => {
    const [sessions, setSessions] = useState<AttendanceSession[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<number | null>(initialSessionId ?? null);
    const [method, setMethod] = useState<CheckInMethod>(null);
    const [wifiSsid, setWifiSsid] = useState('');
    const [qrPayload, setQrPayload] = useState(initialQrToken);
    const [status, setStatus] = useState<'idle' | 'validating' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [scannerState, setScannerState] = useState<ScannerState>('idle');
    const [scannerNote, setScannerNote] = useState('');
    const [scannerEngine, setScannerEngine] = useState<'native' | 'fallback' | null>(null);
    const [biometricStatus, setBiometricStatus] = useState<'idle' | 'verifying' | 'verified' | 'error'>('idle');
    const [biometricMessage, setBiometricMessage] = useState('');
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const scannerRegionRef = useRef<HTMLDivElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const html5QrRef = useRef<Html5Qrcode | null>(null);
    const frameRef = useRef<number | null>(null);
    const detectingRef = useRef(false);

    const selectedSession = useMemo(
        () => sessions.find((s) => s.id === selectedSessionId) ?? null,
        [sessions, selectedSessionId]
    );

    useEffect(() => {
        const loadSessions = async () => {
            const response = await fetch(`${API_BASE}/api/attendance/sessions?active=false`);
            const data = await response.json().catch(() => []);
            const list = Array.isArray(data) ? data : [];
            setSessions(list);

            if (!selectedSessionId && list.length > 0) {
                const active = list.find((s) => s.active);
                setSelectedSessionId((active ?? list[0]).id);
            }
        };
        loadSessions();
    }, [selectedSessionId]);

    useEffect(() => {
        if (initialQrToken) {
            setQrPayload(initialQrToken);
            setMethod('qr');
        }
    }, [initialQrToken]);

    const stopQrScanner = () => {
        if (frameRef.current !== null) {
            cancelAnimationFrame(frameRef.current);
            frameRef.current = null;
        }
        detectingRef.current = false;

        const stream = streamRef.current;
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }

        const video = videoRef.current;
        if (video) {
            video.pause();
            video.srcObject = null;
        }

        const fallbackScanner = html5QrRef.current;
        if (fallbackScanner) {
            void fallbackScanner.stop().catch(() => undefined).finally(() => {
                try {
                    fallbackScanner.clear();
                } catch {
                    // no-op
                }
            });
            html5QrRef.current = null;
        }

        if (scannerRegionRef.current) {
            scannerRegionRef.current.innerHTML = '';
        }
        setScannerEngine(null);
    };

    const startFallbackScanner = async () => {
        const scannerRegion = scannerRegionRef.current;
        if (!scannerRegion) return false;

        scannerRegion.innerHTML = '';
        const scanner = new Html5Qrcode(scannerRegionId, { verbose: false });
        html5QrRef.current = scanner;
        setScannerEngine('fallback');

        let captured = false;
        const onScanSuccess = (decodedText: string) => {
            if (captured) return;
            captured = true;
            setQrPayload(decodedText.trim());
            setScannerState('scanned');
            setScannerNote('QR captured. You can now validate check-in.');
            stopQrScanner();
        };

        const config = { fps: 10, qrbox: { width: 220, height: 220 } };

        try {
            await scanner.start({ facingMode: 'environment' }, config, onScanSuccess, () => undefined);
            setScannerState('active');
            setScannerNote('Point your camera at the attendance QR code.');
            return true;
        } catch {
            try {
                const cameras = await Html5Qrcode.getCameras();
                const preferred = cameras.find((cam) => /back|rear|environment/i.test(cam.label)) ?? cameras[0];
                if (!preferred) {
                    throw new Error('No camera found');
                }
                await scanner.start({ deviceId: { exact: preferred.id } }, config, onScanSuccess, () => undefined);
                setScannerState('active');
                setScannerNote('Point your camera at the attendance QR code.');
                return true;
            } catch {
                try {
                    scanner.clear();
                } catch {
                    // no-op
                }
                html5QrRef.current = null;
                setScannerEngine(null);
                return false;
            }
        }
    };

    const startQrScanner = async () => {
        if (method !== 'qr') return;

        const video = videoRef.current;
        if (!video) return;

        if (!window.isSecureContext && window.location.hostname !== 'localhost') {
            setScannerState('unsupported');
            setScannerNote('Camera on mobile browser requires HTTPS. Use https URL or enter payload manually.');
            return;
        }

        if (!navigator.mediaDevices?.getUserMedia) {
            setScannerState('unsupported');
            setScannerNote('Camera is not supported on this browser. Enter payload manually.');
            return;
        }

        const BarcodeDetectorClass = getBarcodeDetector();
        if (!BarcodeDetectorClass) {
            setScannerState('starting');
            setScannerNote('Opening camera scanner...');
            const fallbackStarted = await startFallbackScanner();
            if (!fallbackStarted) {
                setScannerState('unsupported');
                setScannerNote('QR auto-scan is not supported on this browser. Enter payload manually.');
            }
            return;
        }

        stopQrScanner();
        setScannerEngine('native');
        setScannerState('starting');
        setScannerNote('Opening camera...');

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: 'environment' } },
                audio: false,
            });
            streamRef.current = stream;
            video.srcObject = stream;
            await video.play();

            const detector = new BarcodeDetectorClass({ formats: ['qr_code'] });
            setScannerState('active');
            setScannerNote('Point your camera at the attendance QR code.');

            const detectFrame = async () => {
                if (method !== 'qr' || !videoRef.current) return;
                if (videoRef.current.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
                    frameRef.current = requestAnimationFrame(() => {
                        void detectFrame();
                    });
                    return;
                }
                if (detectingRef.current) {
                    frameRef.current = requestAnimationFrame(() => {
                        void detectFrame();
                    });
                    return;
                }
                detectingRef.current = true;
                try {
                    const barcodes = await detector.detect(videoRef.current);
                    const match = barcodes.find((item) => item.rawValue?.trim());
                    if (match?.rawValue) {
                        setQrPayload(match.rawValue.trim());
                        setScannerState('scanned');
                        setScannerNote('QR captured. You can now validate check-in.');
                        stopQrScanner();
                        return;
                    }
                } catch {
                    setScannerState('error');
                    setScannerNote('Could not read QR from camera. Use manual entry or restart scanner.');
                    stopQrScanner();
                    return;
                } finally {
                    detectingRef.current = false;
                }

                frameRef.current = requestAnimationFrame(() => {
                    void detectFrame();
                });
            };

            frameRef.current = requestAnimationFrame(() => {
                void detectFrame();
            });
        } catch {
            setScannerState('error');
            setScannerNote('Camera access failed. Allow permission and restart scanner.');
            stopQrScanner();
        }
    };

    useEffect(() => {
        if (method === 'qr') {
            void startQrScanner();
        } else {
            stopQrScanner();
            setScannerState('idle');
            setScannerNote('');
        }

        return () => {
            stopQrScanner();
        };
    }, [method]);

    const toRadians = (value: number) => (value * Math.PI) / 180;
    const distanceInMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const earthRadius = 6371000;
        const dLat = toRadians(lat2 - lat1);
        const dLon = toRadians(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadius * c;
    };

    const getCampusFence = (campusName: string) => {
        const normalized = campusName.toLowerCase();
        if (normalized.includes('gish')) return CAMPUS_GEOFENCE.gishushu;
        if (normalized.includes('masoro')) return CAMPUS_GEOFENCE.masoro;
        return null;
    };

    const getCurrentPosition = (): Promise<GeolocationPosition> =>
        new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by your browser.'));
                return;
            }
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 12000,
                maximumAge: 0,
            });
        });

    const getBestCurrentPosition = async () => {
        let bestPosition = await getCurrentPosition();
        for (let attempt = 0; attempt < 2 && bestPosition.coords.accuracy > MAX_ACCEPTABLE_LOCATION_ACCURACY_METERS; attempt += 1) {
            const nextPosition = await getCurrentPosition();
            if (nextPosition.coords.accuracy < bestPosition.coords.accuracy) {
                bestPosition = nextPosition;
            }
        }
        return bestPosition;
    };

    const randomBytes = (length: number) => {
        const bytes = new Uint8Array(length);
        crypto.getRandomValues(bytes);
        return bytes;
    };

    const requestBiometricVerification = async () => {
        if (!window.PublicKeyCredential || !navigator.credentials?.create) {
            throw new Error('Biometric authentication is not supported on this device/browser.');
        }

        const credential = await navigator.credentials.create({
            publicKey: {
                challenge: randomBytes(32),
                rp: { name: 'AUCASA Student Hub' },
                user: {
                    id: randomBytes(16),
                    name: `${studentNumber}@aucasa.local`,
                    displayName: studentNumber,
                },
                pubKeyCredParams: [
                    { type: 'public-key', alg: -7 },
                    { type: 'public-key', alg: -257 },
                ],
                authenticatorSelection: {
                    authenticatorAttachment: 'platform',
                    userVerification: 'required',
                    residentKey: 'preferred',
                },
                timeout: 60000,
                attestation: 'none',
            },
        });

        if (!(credential instanceof PublicKeyCredential)) {
            throw new Error('Biometric verification failed. Please try again.');
        }

        const now = new Date().toISOString();
        setBiometricStatus('verified');
        setBiometricMessage('Biometric verification successful.');
        return { verifiedAt: now, provider: 'platform-webauthn' };
    };

    const validateCampusLocation = async (sessionCampus: string) => {
        const fence = getCampusFence(sessionCampus);
        if (!fence) {
            throw new Error('Campus geofence is not configured for this session.');
        }

        const position = await getBestCurrentPosition();
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        const accuracyMeters = position.coords.accuracy;
        const distance = distanceInMeters(userLat, userLng, fence.lat, fence.lng);

        if (distance > fence.radiusMeters) {
            throw new Error(`Check-in denied: you are outside ${sessionCampus} campus boundary.`);
        }
        return { userLat, userLng, accuracyMeters };
    };

    const submitCheckIn = async () => {
        if (!studentNumber) {
            setStatus('error');
            setMessage('Please login first.');
            return;
        }
        if (!selectedSession) {
            setStatus('error');
            setMessage('Please select a session.');
            return;
        }
        if (!method) {
            setStatus('error');
            setMessage('Please select a verification method.');
            return;
        }
        if (method === 'wifi' && !wifiSsid.trim()) {
            setStatus('error');
            setMessage('Enter Wi-Fi SSID before Wi-Fi check-in.');
            return;
        }
        if (method === 'qr' && !qrPayload.trim()) {
            setStatus('error');
            setMessage('Enter scanned QR payload first.');
            return;
        }

        setStatus('validating');
        setMessage('Validating geofence and session...');

        try {
            const location = await validateCampusLocation(selectedSession.campus);
            const backendMethod = method === 'qr' ? 'manual' : method;
            let biometricProof: { verifiedAt: string; provider: string } | null = null;
            if (backendMethod === 'biometric') {
                setBiometricStatus('verifying');
                setBiometricMessage('Confirm your fingerprint or device biometrics.');
                biometricProof = await requestBiometricVerification();
            }
            const parsedQr = method === 'qr' ? (() => {
                const trimmed = qrPayload.trim();
                if (!trimmed.startsWith('http')) {
                    const sessionFromToken = Number(trimmed.split('.')[0]);
                    return {
                        token: trimmed,
                        sessionId: Number.isNaN(sessionFromToken) ? selectedSession.id : sessionFromToken,
                    };
                }
                try {
                    const u = new URL(trimmed);
                    const token = u.searchParams.get('attendanceQr') ?? trimmed;
                    const sessionFromQuery = Number(u.searchParams.get('attendanceSession'));
                    const sessionFromToken = Number(token.split('.')[0]);
                    const resolvedSession = !Number.isNaN(sessionFromQuery)
                        ? sessionFromQuery
                        : (!Number.isNaN(sessionFromToken) ? sessionFromToken : selectedSession.id);
                    return { token, sessionId: resolvedSession };
                } catch {
                    const sessionFromToken = Number(trimmed.split('.')[0]);
                    return {
                        token: trimmed,
                        sessionId: Number.isNaN(sessionFromToken) ? selectedSession.id : sessionFromToken,
                    };
                }
            })() : { token: '', sessionId: selectedSession.id };
            const response = await fetch(`${API_BASE}/api/attendance/check-in`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentNumber,
                    sessionId: parsedQr.sessionId,
                    method: backendMethod,
                    qrToken: method === 'qr' ? parsedQr.token : undefined,
                    wifiSsid: backendMethod === 'wifi' ? wifiSsid : undefined,
                    latitude: location.userLat,
                    longitude: location.userLng,
                    locationAccuracyMeters: location.accuracyMeters,
                    mockLocation: false,
                    biometricVerified: backendMethod === 'biometric' ? true : undefined,
                    biometricVerifiedAt: backendMethod === 'biometric' ? biometricProof?.verifiedAt : undefined,
                    biometricProvider: backendMethod === 'biometric' ? biometricProof?.provider : undefined,
                    deviceInfo: navigator.userAgent,
                }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error ?? 'Check-in failed.');
            }

            setStatus('success');
            setMessage('Check-in successful. Location and session validated.');
        } catch (err) {
            if (method === 'biometric') {
                setBiometricStatus('error');
                setBiometricMessage(err instanceof Error ? err.message : 'Biometric verification failed.');
            }
            setStatus('error');
            setMessage(err instanceof Error ? err.message : 'Check-in failed.');
        }
    };

    return (
        <div className="attendance-checkin-v2">
            <div className="checkin-head">
                <button className="back-btn" onClick={onBack}>
                    <ChevronLeft size={16} /> Back
                </button>
                <span className="head-kicker">Attendance Portal</span>
                <h1>Confirm Your Presence</h1>
                <p>Digital authentication ensures academic integrity. Please select your current session and method of verification below.</p>
            </div>

            <div className="checkin-grid">
                <div className="checkin-main">
                    <section className="panel light">
                        <h3><BedSingle size={16} /> Active Session</h3>
                        <div className="session-select-wrap">
                            <select
                                value={selectedSessionId ?? ''}
                                onChange={(e) => setSelectedSessionId(Number(e.target.value))}
                            >
                                {sessions.map((session) => (
                                    <option key={session.id} value={session.id}>
                                        {session.title} - {session.campus}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown size={16} />
                        </div>
                    </section>

                    <section className="methods-section">
                        <h3>Verification Methods</h3>
                        <div className="method-cards">
                            <button className={method === 'biometric' ? 'active' : ''} onClick={() => setMethod('biometric')}>
                                <span className="icon-pill"><Fingerprint size={18} /></span>
                                <span>Biometric</span>
                            </button>
                            <button className={method === 'wifi' ? 'active' : ''} onClick={() => setMethod('wifi')}>
                                <span className="icon-pill"><Wifi size={18} /></span>
                                <span>School Wi-Fi</span>
                            </button>
                            <button className={method === 'qr' ? 'active' : ''} onClick={() => setMethod('qr')}>
                                <span className="icon-pill"><QrCode size={18} /></span>
                                <span>QR Code</span>
                            </button>
                        </div>
                    </section>

                    <section className="panel dark">
                        <div className="scan-layout">
                            <div className="scan-box">
                                {method === 'qr' ? (
                                    <div className="qr-preview-wrap">
                                        <video
                                            ref={videoRef}
                                            className={`qr-video ${scannerEngine === 'native' ? 'active' : ''}`}
                                            muted
                                            playsInline
                                            autoPlay
                                        />
                                        <div
                                            id={scannerRegionId}
                                            ref={scannerRegionRef}
                                            className={`qr-fallback-reader ${scannerEngine === 'fallback' ? 'active' : ''}`}
                                        />
                                    </div>
                                ) : (
                                    <QrCode size={74} />
                                )}
                            </div>
                            <div className="scan-form">
                                <h3>Scan or Enter Payload</h3>
                                <p>
                                    {method === 'qr'
                                        ? 'Camera opens automatically for QR scanning. You can still paste payload manually if needed.'
                                        : 'Align the QR code in scanner or manually enter the session token payload below.'}
                                </p>
                                {method === 'qr' && scannerState !== 'idle' && (
                                    <p className={`scanner-note ${scannerState}`}>{scannerNote}</p>
                                )}
                                {method === 'biometric' && biometricStatus !== 'idle' && (
                                    <p className={`scanner-note ${biometricStatus}`}>{biometricMessage}</p>
                                )}
                                {status !== 'idle' && (
                                    <div className={`inline-checkin-status ${status}`}>
                                        {status === 'success' && <CheckCircle2 size={17} />}
                                        {status === 'error' && <ShieldCheck size={17} />}
                                        <span>{message}</span>
                                    </div>
                                )}
                                <input
                                    type="text"
                                    placeholder="Enter QR token payload"
                                    value={qrPayload}
                                    onChange={(e) => setQrPayload(e.target.value)}
                                    disabled={method !== 'qr'}
                                />
                                {method === 'qr' && (
                                    <button
                                        type="button"
                                        className="scan-restart-btn"
                                        onClick={() => {
                                            void startQrScanner();
                                        }}
                                    >
                                        Restart Camera Scanner
                                    </button>
                                )}
                                {method === 'wifi' && (
                                    <input
                                        type="text"
                                        placeholder="Enter campus Wi-Fi SSID"
                                        value={wifiSsid}
                                        onChange={(e) => setWifiSsid(e.target.value)}
                                    />
                                )}
                                <button className="submit-btn" onClick={submitCheckIn} disabled={status === 'validating'}>
                                    <ShieldCheck size={16} />
                                    {status === 'validating' ? 'Validating...' : 'Validate Check-In'}
                                </button>
                            </div>
                        </div>
                    </section>
                </div>

                <aside className="checkin-side">
                    {selectedSession?.campus?.toLowerCase().includes('masoro') && (
                        <div className="campus-showcase animate-fade">
                            <img src={masoroCampus} alt="Masoro Campus" />
                            <div className="campus-overlay">
                                <span>MASORO CAMPUS</span>
                                <h4>Main Academic Hub</h4>
                            </div>
                        </div>
                    )}

                    <section className="panel light rules">
                        <h3><MapPin size={16} /> Location Rules</h3>
                        <div className="rule-item">
                            <span>1</span>
                            <div>
                                <strong>Geofence Required</strong>
                                <p>You must be inside Gishushu or Masoro campus range for check-in to validate.</p>
                            </div>
                        </div>
                        <div className="rule-item">
                            <span>2</span>
                            <div>
                                <strong>Network Identity</strong>
                                <p>If using School Wi-Fi method, your SSID must match the campus network.</p>
                            </div>
                        </div>
                        <div className="rule-item">
                            <span>3</span>
                            <div>
                                <strong>Time Window</strong>
                                <p>Check-in closes after the session time window ends.</p>
                            </div>
                        </div>
                        <div className="rule-item">
                            <span>4</span>
                            <div>
                                <strong>Biometric Freshness</strong>
                                <p>Biometric verification must be recent and is checked together with geofence.</p>
                            </div>
                        </div>

                        <div className="note-box">
                            <Info size={14} />
                            <p>Failed checks will require manual review by the session administrator.</p>
                        </div>
                    </section>

                </aside>
            </div>
        </div>
    );
};

export default AttendanceCheckIn;
