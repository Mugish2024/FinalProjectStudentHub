import studentCardFront from '../assets/student-card-front.png';
import studentCardBack from '../assets/student-card-back.png';
import studentCardRightLogo from '../assets/student-card-right-logo.png';
import aucaLogo from '../assets/auca-logo.png';

export type StudentCardDetails = {
    fullName: string;
    studentNumber: string;
    faculty: string;
    department: string;
    program: string;
};

const readImage = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Failed to load image.'));
        image.src = src;
    });

export const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ''));
        reader.onerror = () => reject(new Error('Failed to read selected image.'));
        reader.readAsDataURL(file);
    });

export const validateStudentCardPhoto = async (file: File) => {
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
        throw new Error('Passport photo must be JPG or PNG.');
    }
    if (file.size > 5 * 1024 * 1024) {
        throw new Error('Passport photo must be 5MB or smaller.');
    }
    const image = await readImage(await fileToDataUrl(file));
    if (image.width < 300 || image.height < 400) {
        throw new Error('Passport photo must be at least 300x400 pixels.');
    }
    return image;
};

const drawPassportImage = (
    context: CanvasRenderingContext2D,
    image: HTMLImageElement,
    x: number,
    y: number,
    width: number,
    height: number,
) => {
    const imageRatio = image.width / image.height;
    const boxRatio = width / height;
    let srcWidth = image.width;
    let srcHeight = image.height;
    let srcX = 0;
    let srcY = 0;

    if (imageRatio > boxRatio) {
        srcWidth = image.height * boxRatio;
        srcX = (image.width - srcWidth) / 2;
    } else {
        srcHeight = image.width / boxRatio;
        srcY = (image.height - srcHeight) / 2;
    }

    context.drawImage(image, srcX, srcY, srcWidth, srcHeight, x, y, width, height);
};

const roundedRect = (
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
) => {
    const safeRadius = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + safeRadius, y);
    context.lineTo(x + width - safeRadius, y);
    context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
    context.lineTo(x + width, y + height - safeRadius);
    context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
    context.lineTo(x + safeRadius, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
    context.lineTo(x, y + safeRadius);
    context.quadraticCurveTo(x, y, x + safeRadius, y);
    context.closePath();
};

const drawCleanCardFrontBase = async (context: CanvasRenderingContext2D, width: number, height: number) => {
    const mainLogo = await readImage(aucaLogo);

    context.clearRect(0, 0, width, height);
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);

    context.fillStyle = '#eaf4fb';
    context.fillRect(0, 0, width, 118);

    context.save();
    context.globalAlpha = 0.34;
    for (let x = -30; x < width; x += 52) {
        for (let y = -20; y < 120; y += 52) {
            context.beginPath();
            context.moveTo(x, y);
            context.lineTo(x + 52, y);
            context.lineTo(x + 26, y + 38);
            context.closePath();
            context.fillStyle = (x + y) % 104 === 0 ? '#b8d8ec' : '#ffffff';
            context.fill();
        }
    }
    context.restore();

    context.fillStyle = '#00679f';
    context.fillRect(0, 118, width, 84);

    context.strokeStyle = '#00679f';
    context.lineWidth = 6;
    context.strokeRect(3, 3, width - 6, height - 6);

    roundedRect(context, 318, 146, 414, 52, 2);
    context.fillStyle = '#f5d9cf';
    context.fill();
    context.strokeStyle = '#ffffff';
    context.lineWidth = 2;
    context.stroke();

    context.fillStyle = '#ffffff';
    context.font = '39px Arial, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('STUDENT ID CARD', 525, 172);

    context.save();
    roundedRect(context, 56, 54, 190, 190, 95);
    context.clip();
    context.drawImage(mainLogo, 56, 54, 190, 190);
    context.restore();

    context.fillStyle = '#00679f';
    context.font = '24px "Times New Roman", Georgia, serif';
    context.textAlign = 'center';
    context.fillText('ADVENTIST UNIVERSITY OF CENTRAL AFRICA', 520, 92);

    context.strokeStyle = '#f5d9cf';
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(102, 490);
    context.lineTo(245, 490);
    context.stroke();
};

const drawLabeledLine = (
    context: CanvasRenderingContext2D,
    label: string,
    value: string,
    labelX: number,
    valueX: number,
    y: number,
) => {
    context.fillStyle = '#0f2345';
    context.font = 'bold 22px "Arial Rounded MT Bold", "Trebuchet MS", Arial, sans-serif';
    context.textAlign = 'right';
    context.textBaseline = 'middle';
    context.fillText(`${label}:`, labelX, y);

    context.font = '700 22px "Arial Rounded MT Bold", "Trebuchet MS", Arial, sans-serif';
    context.textAlign = 'left';
    context.fillText(value, valueX, y);
};

const drawRightBottomLogo = async (context: CanvasRenderingContext2D) => {
    const cleanLogo = await readImage(studentCardRightLogo);
    context.fillStyle = '#ffffff';
    context.fillRect(636, 370, 156, 164);
    context.drawImage(cleanLogo, 657, 391, 118, 118);
};

export const createStudentCardCanvases = async (details: StudentCardDetails, photoSource: string | File) => {
    const [frontTemplate, backTemplate, photoImage] = await Promise.all([
        readImage(studentCardFront),
        readImage(studentCardBack),
        typeof photoSource === 'string' ? readImage(photoSource) : validateStudentCardPhoto(photoSource),
    ]);

    const frontCanvas = document.createElement('canvas');
    frontCanvas.width = frontTemplate.width;
    frontCanvas.height = frontTemplate.height;
    const frontCtx = frontCanvas.getContext('2d');
    if (!frontCtx) throw new Error('Failed to prepare student card canvas.');

    await drawCleanCardFrontBase(frontCtx, frontCanvas.width, frontCanvas.height);
    drawPassportImage(frontCtx, photoImage, 42, 235, 210, 224);
    await drawRightBottomLogo(frontCtx);

    const campus = (details.faculty ?? '').trim().toLowerCase().includes('information technology')
        ? 'GISHUSHU CAMPUS'
        : 'MASORO CAMPUS';

    frontCtx.fillStyle = '#d91d63';
    frontCtx.font = 'bold 20px "Arial Rounded MT Bold", "Trebuchet MS", Arial, sans-serif';
    frontCtx.textAlign = 'center';
    frontCtx.textBaseline = 'middle';
    frontCtx.fillText('UNDERGRADUATE PROGRAM', 570, 234);

    drawLabeledLine(frontCtx, 'NAME', details.fullName || 'Student Name', 438, 458, 286);
    drawLabeledLine(frontCtx, 'FACULTY', details.faculty || 'Faculty', 438, 458, 336);
    drawLabeledLine(frontCtx, 'DEPARTMENT', details.department || 'Department', 438, 458, 386);
    drawLabeledLine(frontCtx, 'REG. NO', details.studentNumber || 'Student ID', 438, 458, 436);
    drawLabeledLine(frontCtx, 'PROGRAM', details.program || 'Day', 438, 458, 486);

    frontCtx.fillStyle = '#07843f';
    frontCtx.font = 'bold 20px "Arial Rounded MT Bold", "Trebuchet MS", Arial, sans-serif';
    frontCtx.textAlign = 'left';
    frontCtx.fillText(campus, 62, 502);

    const backCanvas = document.createElement('canvas');
    backCanvas.width = backTemplate.width;
    backCanvas.height = backTemplate.height;
    const backCtx = backCanvas.getContext('2d');
    if (!backCtx) throw new Error('Failed to prepare student card back.');
    backCtx.drawImage(backTemplate, 0, 0);

    return { frontCanvas, backCanvas };
};

export const downloadCanvas = (canvas: HTMLCanvasElement, filename: string) => {
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
};

export const downloadStudentCard = async (details: StudentCardDetails, photoSource: string | File) => {
    const { frontCanvas, backCanvas } = await createStudentCardCanvases(details, photoSource);
    const safeId = (details.studentNumber || 'student').replace(/[^a-zA-Z0-9_-]/g, '');
    downloadCanvas(frontCanvas, `student-card-front-${safeId}.png`);
    downloadCanvas(backCanvas, `student-card-back-${safeId}.png`);
};
