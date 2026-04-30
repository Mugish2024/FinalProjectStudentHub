package aucasa.com.rw.controller;

import aucasa.com.rw.dto.admin.CreateSystemUserRequest;
import aucasa.com.rw.dto.admin.UpdateSystemUserRequest;
import aucasa.com.rw.dto.user.UserDirectoryItem;
import aucasa.com.rw.service.AdminUserService;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/users")
@CrossOrigin(originPatterns = {"http://localhost:5173", "https://localhost:5173", "http://127.0.0.1:5173", "https://127.0.0.1:5173", "http://10.*.*.*:5173", "https://10.*.*.*:5173", "https://*.loca.lt", "https://*.trycloudflare.com"})
public class AdminUserController {
    private final AdminUserService adminUserService;

    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @PostMapping
    public ResponseEntity<?> createSystemUser(@RequestBody CreateSystemUserRequest request) {
        try {
            UserDirectoryItem response = adminUserService.createSystemUser(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping
    public List<UserDirectoryItem> listSystemUsers() {
        return adminUserService.listSystemUsers();
    }

    @PutMapping("/{userId}")
    public ResponseEntity<?> updateSystemUser(@PathVariable Long userId, @RequestBody UpdateSystemUserRequest request) {
        try {
            UserDirectoryItem response = adminUserService.updateSystemUser(userId, request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }
}
