package aucasa.com.rw.service;

import aucasa.com.rw.domain.Election;
import aucasa.com.rw.domain.ElectionCandidate;
import aucasa.com.rw.domain.StudentProfile;
import aucasa.com.rw.domain.enums.ElectionStatus;
import aucasa.com.rw.dto.election.ElectionCandidateAdminResponse;
import aucasa.com.rw.dto.election.ElectionCandidateResponse;
import aucasa.com.rw.repository.ElectionCandidateRepository;
import aucasa.com.rw.repository.ElectionRepository;
import aucasa.com.rw.repository.StudentProfileRepository;
import java.io.File;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Set;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ElectionCandidateService {
    private final ElectionCandidateRepository candidateRepository;
    private final ElectionRepository electionRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final Path uploadDir;

    private static final Set<String> ADVENTIST_REQUIRED_POSITIONS = Set.of(
            "AUCASA GUILD PRESIDENT",
            "AUCASA GUILD PRESIDENT MASORO CAMPUS",
            "AUCASA GUILD PRESIDENT GISHUSHU CAMPUS",
            "AUCASA GUILD PRESIDENT NURSING AND MIDWIFERY",
            "AUCASA PRESIDENT OF FINANCE",
            "AUCASA MINISTER OF EVANGELISM"
    );

    public ElectionCandidateService(
            ElectionCandidateRepository candidateRepository,
            ElectionRepository electionRepository,
            StudentProfileRepository studentProfileRepository,
            @Value("${app.storage.election-upload-dir:}") String uploadDir
    ) {
        this.candidateRepository = candidateRepository;
        this.electionRepository = electionRepository;
        this.studentProfileRepository = studentProfileRepository;
        this.uploadDir = resolveUploadDir(uploadDir);
    }

    @Transactional
    public ElectionCandidateAdminResponse applyCandidate(
            String studentNumber,
            String position,
            String slogan,
            String manifesto,
            String gpa,
            String credits,
            String disciplineStatus,
            MultipartFile adventistProof,
            MultipartFile transcript,
            MultipartFile professionalPhoto,
            MultipartFile certificates
    ) {
        if (isBlank(studentNumber) || isBlank(position) || isBlank(gpa) || isBlank(credits) || isBlank(disciplineStatus)) {
            throw new IllegalArgumentException("studentNumber, position, gpa, credits, and disciplineStatus are required.");
        }

        StudentProfile student = studentProfileRepository.findByStudentNumber(studentNumber.trim())
                .orElseThrow(() -> new IllegalArgumentException("Student not found."));

        Election election = electionRepository.findByStatus(ElectionStatus.NOMINATION).stream().findFirst()
                .orElseThrow(() -> new IllegalArgumentException("No active nomination election found."));

        BigDecimal parsedGpa = new BigDecimal(gpa.trim());
        Integer parsedCredits = Integer.parseInt(credits.trim());

        if (parsedCredits < 45 || parsedCredits > 100) {
            throw new IllegalArgumentException("Credits must be between 45 and 100.");
        }
        if (parsedGpa.compareTo(new BigDecimal("14.0")) < 0) {
            throw new IllegalArgumentException("GPA must be 14.0 or above.");
        }
        if (!isGoodDiscipline(disciplineStatus)) {
            throw new IllegalArgumentException("Discipline status must be good.");
        }

        boolean adventistRequired = ADVENTIST_REQUIRED_POSITIONS.contains(position.trim().toUpperCase());
        if (adventistRequired && (adventistProof == null || adventistProof.isEmpty())) {
            throw new IllegalArgumentException("Adventist proof is required for this position.");
        }
        if (transcript == null || transcript.isEmpty()) {
            throw new IllegalArgumentException("Transcript document is required.");
        }
        if (professionalPhoto == null || professionalPhoto.isEmpty()) {
            throw new IllegalArgumentException("Professional photo is required.");
        }
        if (certificates == null || certificates.isEmpty()) {
            throw new IllegalArgumentException("Certificates document is required.");
        }

        ElectionCandidate candidate = new ElectionCandidate();
        candidate.setElection(election);
        candidate.setStudent(student);
        candidate.setPosition(position.trim());
        candidate.setSlogan(safeTrim(slogan));
        candidate.setManifesto(safeTrim(manifesto));
        candidate.setGpa(parsedGpa);
        candidate.setCredits(parsedCredits);
        candidate.setDisciplineStatus(disciplineStatus.trim());
        candidate.setApproved(false);

        candidate.setTranscriptPath(storeFile(transcript, "transcript"));
        candidate.setProfessionalPhotoPath(storeFile(professionalPhoto, "photo"));
        candidate.setCertificatesPath(storeFile(certificates, "certificates"));

        if (adventistProof != null && !adventistProof.isEmpty()) {
            candidate.setAdventistProofPath(storeFile(adventistProof, "adventist"));
        }

        candidate = candidateRepository.save(candidate);
        return toAdminResponse(candidate);
    }

    @Transactional(readOnly = true)
    public List<ElectionCandidateResponse> listApproved() {
        return candidateRepository.findByApprovedTrue().stream().map(this::toPublicResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<ElectionCandidateAdminResponse> listPending() {
        return candidateRepository.findByApprovedFalse().stream().map(this::toAdminResponse).toList();
    }

    @Transactional
    public ElectionCandidateAdminResponse approveCandidate(Long id) {
        ElectionCandidate candidate = candidateRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Candidate not found."));
        candidate.setApproved(true);
        candidate = candidateRepository.save(candidate);
        return toAdminResponse(candidate);
    }

    @Transactional(readOnly = true)
    public Resource loadCandidatePhoto(Long id) {
        ElectionCandidate candidate = candidateRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Candidate not found."));
        String path = candidate.getProfessionalPhotoPath();
        if (isBlank(path)) {
            throw new IllegalArgumentException("Photo not available.");
        }
        return loadResource(path);
    }

    private ElectionCandidateResponse toPublicResponse(ElectionCandidate candidate) {
        String studentName = candidate.getStudent() != null && candidate.getStudent().getUserAccount() != null
                ? candidate.getStudent().getUserAccount().getFirstName() + " " + candidate.getStudent().getUserAccount().getLastName()
                : "";
        String studentNumber = candidate.getStudent() != null ? candidate.getStudent().getStudentNumber() : "";
        String photoUrl = "/api/elections/candidates/" + candidate.getId() + "/photo";
        return new ElectionCandidateResponse(
                candidate.getId(),
                studentName,
                studentNumber,
                candidate.getPosition(),
                candidate.getSlogan(),
                candidate.getManifesto(),
                Boolean.TRUE.equals(candidate.getApproved()),
                candidate.getGpa() != null ? candidate.getGpa().toPlainString() : "",
                candidate.getCredits(),
                candidate.getDisciplineStatus(),
                photoUrl
        );
    }

    private ElectionCandidateAdminResponse toAdminResponse(ElectionCandidate candidate) {
        String studentName = candidate.getStudent() != null && candidate.getStudent().getUserAccount() != null
                ? candidate.getStudent().getUserAccount().getFirstName() + " " + candidate.getStudent().getUserAccount().getLastName()
                : "";
        String studentNumber = candidate.getStudent() != null ? candidate.getStudent().getStudentNumber() : "";
        return new ElectionCandidateAdminResponse(
                candidate.getId(),
                studentName,
                studentNumber,
                candidate.getPosition(),
                candidate.getSlogan(),
                candidate.getManifesto(),
                Boolean.TRUE.equals(candidate.getApproved()),
                candidate.getGpa() != null ? candidate.getGpa().toPlainString() : "",
                candidate.getCredits(),
                candidate.getDisciplineStatus(),
                candidate.getAdventistProofPath(),
                candidate.getTranscriptPath(),
                candidate.getProfessionalPhotoPath(),
                candidate.getCertificatesPath()
        );
    }

    private String storeFile(MultipartFile file, String prefix) {
        try {
            Files.createDirectories(uploadDir);
            String original = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document";
            String safeName = original.replaceAll("[^a-zA-Z0-9._-]", "_");
            String filename = prefix + "-" + System.currentTimeMillis() + "-" + safeName;
            Path destination = uploadDir.resolve(filename).normalize();
            if (!destination.startsWith(uploadDir)) {
                throw new IllegalArgumentException("Invalid file path.");
            }
            Files.copy(file.getInputStream(), destination);
            return destination.toString().replace("\\", "/");
        } catch (IOException ex) {
            throw new IllegalArgumentException("Failed to store file. Check server write permissions.");
        }
    }

    private Resource loadResource(String storedPath) {
        try {
            Path path = Paths.get(storedPath).toAbsolutePath().normalize();
            File file = path.toFile();
            if (!file.exists()) {
                throw new IllegalArgumentException("File not found.");
            }
            return new UrlResource(file.toURI());
        } catch (Exception ex) {
            throw new IllegalArgumentException("File not available.");
        }
    }

    private boolean isGoodDiscipline(String value) {
        String normalized = value.trim().toUpperCase();
        return normalized.contains("GOOD") || normalized.contains("SATISFACTORY");
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private String safeTrim(String value) {
        return isBlank(value) ? null : value.trim();
    }

    private Path resolveUploadDir(String configured) {
        if (configured != null && !configured.isBlank()) {
            return Paths.get(configured).toAbsolutePath().normalize();
        }
        String home = System.getProperty("user.home");
        return Paths.get(home, "FinalProjectStudentHubUploads", "elections").toAbsolutePath().normalize();
    }
}
