package aucasa.com.rw.domain;

import aucasa.com.rw.domain.enums.ElectionStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "elections")
public class Election extends BaseEntity {

    @Column(nullable = false, length = 180)
    private String title;

    @Column(length = 1200)
    private String description;

    @Column(nullable = false)
    private LocalDateTime nominationStart;

    @Column(nullable = false)
    private LocalDateTime nominationEnd;

    @Column(nullable = false)
    private LocalDateTime campaignStart;

    @Column(nullable = false)
    private LocalDateTime campaignEnd;

    @Column(nullable = false)
    private LocalDateTime votingStart;

    @Column(nullable = false)
    private LocalDateTime votingEnd;

    @Column(nullable = false)
    private Integer eligibleVoters = 0;

    @Column(nullable = false)
    private Integer totalVotes = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ElectionStatus status = ElectionStatus.DRAFT;

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDateTime getNominationStart() {
        return nominationStart;
    }

    public void setNominationStart(LocalDateTime nominationStart) {
        this.nominationStart = nominationStart;
    }

    public LocalDateTime getNominationEnd() {
        return nominationEnd;
    }

    public void setNominationEnd(LocalDateTime nominationEnd) {
        this.nominationEnd = nominationEnd;
    }

    public LocalDateTime getCampaignStart() {
        return campaignStart;
    }

    public void setCampaignStart(LocalDateTime campaignStart) {
        this.campaignStart = campaignStart;
    }

    public LocalDateTime getCampaignEnd() {
        return campaignEnd;
    }

    public void setCampaignEnd(LocalDateTime campaignEnd) {
        this.campaignEnd = campaignEnd;
    }

    public LocalDateTime getVotingStart() {
        return votingStart;
    }

    public void setVotingStart(LocalDateTime votingStart) {
        this.votingStart = votingStart;
    }

    public LocalDateTime getVotingEnd() {
        return votingEnd;
    }

    public void setVotingEnd(LocalDateTime votingEnd) {
        this.votingEnd = votingEnd;
    }

    public Integer getEligibleVoters() {
        return eligibleVoters;
    }

    public void setEligibleVoters(Integer eligibleVoters) {
        this.eligibleVoters = eligibleVoters;
    }

    public Integer getTotalVotes() {
        return totalVotes;
    }

    public void setTotalVotes(Integer totalVotes) {
        this.totalVotes = totalVotes;
    }

    public ElectionStatus getStatus() {
        return status;
    }

    public void setStatus(ElectionStatus status) {
        this.status = status;
    }
}
