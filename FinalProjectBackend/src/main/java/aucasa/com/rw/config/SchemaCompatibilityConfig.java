package aucasa.com.rw.config;

import javax.sql.DataSource;
import java.sql.Connection;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class SchemaCompatibilityConfig implements CommandLineRunner {
    private final DataSource dataSource;
    private final JdbcTemplate jdbcTemplate;

    public SchemaCompatibilityConfig(DataSource dataSource, JdbcTemplate jdbcTemplate) {
        this.dataSource = dataSource;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) throws Exception {
        String databaseName;
        try (Connection connection = dataSource.getConnection()) {
            databaseName = connection.getMetaData().getDatabaseProductName();
        }
        if (databaseName == null || !databaseName.toLowerCase().contains("postgres")) {
            return;
        }

        jdbcTemplate.execute("ALTER TABLE labour_applications DROP CONSTRAINT IF EXISTS labour_applications_status_check");
        jdbcTemplate.execute("""
                ALTER TABLE labour_applications
                ADD CONSTRAINT labour_applications_status_check
                CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN'))
                """);
        jdbcTemplate.execute("ALTER TABLE finance_expenses DROP CONSTRAINT IF EXISTS finance_expenses_category_check");
        jdbcTemplate.execute("""
                ALTER TABLE finance_expenses
                ADD CONSTRAINT finance_expenses_category_check
                CHECK (category IN (
                    'OPERATIONS',
                    'EVENTS',
                    'TRANSPORT',
                    'REFRESHMENTS',
                    'WELFARE',
                    'STAFF_WELFARE',
                    'EQUIPMENT',
                    'COMMUNICATION',
                    'OTHER'
                ))
                """);
    }
}
