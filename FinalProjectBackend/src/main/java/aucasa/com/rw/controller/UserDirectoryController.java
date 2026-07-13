package aucasa.com.rw.controller;

import aucasa.com.rw.domain.StudentProfile;
import aucasa.com.rw.domain.UserAccount;
import aucasa.com.rw.domain.enums.RoleType;
import aucasa.com.rw.dto.user.UserDirectoryItem;
import aucasa.com.rw.repository.StudentProfileRepository;
import aucasa.com.rw.repository.UserAccountRepository;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(originPatterns = {"http://localhost:5173", "https://localhost:5173", "http://127.0.0.1:5173", "https://127.0.0.1:5173", "http://10.*.*.*:5173", "https://10.*.*.*:5173", "http://192.168.*.*:5173", "https://192.168.*.*:5173", "https://*.loca.lt", "https://*.trycloudflare.com"})
public class UserDirectoryController {
    private final UserAccountRepository userAccountRepository;
    private final StudentProfileRepository studentProfileRepository;

    public UserDirectoryController(UserAccountRepository userAccountRepository,
                                   StudentProfileRepository studentProfileRepository) {
        this.userAccountRepository = userAccountRepository;
        this.studentProfileRepository = studentProfileRepository;
    }

    @GetMapping("/recipients")
    public List<UserDirectoryItem> listRecipients(@RequestParam String role) {
        if ("student".equalsIgnoreCase(role)) {
            return studentProfileRepository.findAll()
                    .stream()
                    .map(student -> new UserDirectoryItem(
                            student.getUserAccount().getId(),
                            student.getUserAccount().getFirstName() + " " + student.getUserAccount().getLastName(),
                            "student",
                            student.getStudentNumber()
                    ))
                    .toList();
        }

        EnumSet<RoleType> staffRoles = EnumSet.of(
                RoleType.STAFF,
                RoleType.DEAN,
                RoleType.ADMIN,
                RoleType.FINANCE,
                RoleType.STUDENT_CARD_MANAGER,
                RoleType.GUILD_PRESIDENT,
                RoleType.MINISTER_SPORT,
                RoleType.MINISTER_EVANGELISM,
                RoleType.MINISTER_INTERNATIONAL_AFFAIRS
        );
        List<UserDirectoryItem> staff = new ArrayList<>();
        for (RoleType roleType : staffRoles) {
            List<UserAccount> accounts = userAccountRepository.findByRoleName(roleType);
            for (UserAccount user : accounts) {
                staff.add(new UserDirectoryItem(
                        user.getId(),
                        user.getFirstName() + " " + user.getLastName(),
                        user.getRole().getName().name().toLowerCase(),
                        null
                ));
            }
        }
        return staff;
    }
}

