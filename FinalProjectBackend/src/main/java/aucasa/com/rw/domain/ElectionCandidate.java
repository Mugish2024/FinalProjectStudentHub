package aucasa.com.rw.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "election_candidates")
public class ElectionCandidate extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "election_id", nullable = false)
    private Election election;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private StudentProfile student;

    @Column(nullable = false, length = 80)
    private String position;

    @Column(length = 250)
    private String slogan;

    @Column(length = 2000)
    private String manifesto;

    @Column(nullable = false)
    private Boolean approved = false;

    @Column(precision = 4, scale = 2)
    private java.math.BigDecimal gpa;

    @Column
    private Integer credits;

    @Column(length = 80)
    private String disciplineStatus;

    @Column(length = 255)
    private String adventistProofPath;

    @Column(length = 255)
    private String transcriptPath;

    @Column(length = 255)
    private String professionalPhotoPath;

    @Column(length = 255)
    private String certificatesPath;

    public Election getElection() {
        return election;
    }

    public void setElection(Election election) {
        this.election = election;
    }

    public StudentProfile getStudent() {
        return student;
    }

    public void setStudent(StudentProfile student) {
        this.student = student;
    }

    public String getPosition() {
        return position;
    }

    public void setPosition(String position) {
        this.position = position;
    }

    public String getSlogan() {
        return slogan;
    }

    public void setSlogan(String slogan) {
        this.slogan = slogan;
    }

    public String getManifesto() {
        return manifesto;
    }

    public void setManifesto(String manifesto) {
        this.manifesto = manifesto;
    }

    public Boolean getApproved() {
        return approved;
    }

    public void setApproved(Boolean approved) {
        this.approved = approved;
    }

    public java.math.BigDecimal getGpa() {
        return gpa;
    }

    public void setGpa(java.math.BigDecimal gpa) {
        this.gpa = gpa;
    }

    public Integer getCredits() {
        return credits;
    }

    public void setCredits(Integer credits) {
        this.credits = credits;
    }

    public String getDisciplineStatus() {
        return disciplineStatus;
    }

    public void setDisciplineStatus(String disciplineStatus) {
        this.disciplineStatus = disciplineStatus;
    }

    public String getAdventistProofPath() {
        return adventistProofPath;
    }

    public void setAdventistProofPath(String adventistProofPath) {
        this.adventistProofPath = adventistProofPath;
    }

    public String getTranscriptPath() {
        return transcriptPath;
    }

    public void setTranscriptPath(String transcriptPath) {
        this.transcriptPath = transcriptPath;
    }

    public String getProfessionalPhotoPath() {
        return professionalPhotoPath;
    }

    public void setProfessionalPhotoPath(String professionalPhotoPath) {
        this.professionalPhotoPath = professionalPhotoPath;
    }

    public String getCertificatesPath() {
        return certificatesPath;
    }

    public void setCertificatesPath(String certificatesPath) {
        this.certificatesPath = certificatesPath;
    }
}
