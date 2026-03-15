package aucasa.com.rw.dto.election;

public class ElectionCandidateAdminResponse {
    private Long id;
    private String studentName;
    private String studentNumber;
    private String position;
    private String slogan;
    private String manifesto;
    private boolean approved;
    private String gpa;
    private Integer credits;
    private String disciplineStatus;
    private String adventistProofPath;
    private String transcriptPath;
    private String professionalPhotoPath;
    private String certificatesPath;

    public ElectionCandidateAdminResponse(
            Long id,
            String studentName,
            String studentNumber,
            String position,
            String slogan,
            String manifesto,
            boolean approved,
            String gpa,
            Integer credits,
            String disciplineStatus,
            String adventistProofPath,
            String transcriptPath,
            String professionalPhotoPath,
            String certificatesPath
    ) {
        this.id = id;
        this.studentName = studentName;
        this.studentNumber = studentNumber;
        this.position = position;
        this.slogan = slogan;
        this.manifesto = manifesto;
        this.approved = approved;
        this.gpa = gpa;
        this.credits = credits;
        this.disciplineStatus = disciplineStatus;
        this.adventistProofPath = adventistProofPath;
        this.transcriptPath = transcriptPath;
        this.professionalPhotoPath = professionalPhotoPath;
        this.certificatesPath = certificatesPath;
    }

    public Long getId() {
        return id;
    }

    public String getStudentName() {
        return studentName;
    }

    public String getStudentNumber() {
        return studentNumber;
    }

    public String getPosition() {
        return position;
    }

    public String getSlogan() {
        return slogan;
    }

    public String getManifesto() {
        return manifesto;
    }

    public boolean isApproved() {
        return approved;
    }

    public String getGpa() {
        return gpa;
    }

    public Integer getCredits() {
        return credits;
    }

    public String getDisciplineStatus() {
        return disciplineStatus;
    }

    public String getAdventistProofPath() {
        return adventistProofPath;
    }

    public String getTranscriptPath() {
        return transcriptPath;
    }

    public String getProfessionalPhotoPath() {
        return professionalPhotoPath;
    }

    public String getCertificatesPath() {
        return certificatesPath;
    }
}
