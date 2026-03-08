package aucasa.com.rw.domain;

import aucasa.com.rw.domain.enums.DisciplineEntryType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;

@Entity
@Table(name = "discipline_entries")
public class DisciplineEntry extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "record_id", nullable = false)
    private DisciplineRecord record;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(nullable = false, length = 700)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DisciplineEntryType type;

    @Column(nullable = false)
    private LocalDate entryDate;

    public DisciplineRecord getRecord() {
        return record;
    }

    public void setRecord(DisciplineRecord record) {
        this.record = record;
    }

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

    public DisciplineEntryType getType() {
        return type;
    }

    public void setType(DisciplineEntryType type) {
        this.type = type;
    }

    public LocalDate getEntryDate() {
        return entryDate;
    }

    public void setEntryDate(LocalDate entryDate) {
        this.entryDate = entryDate;
    }
}
