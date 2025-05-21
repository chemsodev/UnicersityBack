import { AdminRole } from '../user.entity';

/**
 * Utility class for role-based access control
 */
export class RolesUtil {
  /**
   * Get all administrative roles (excluding ETUDIANT and ENSEIGNANT)
   * @returns Array of administrative roles
   */
  static getAdminRoles(): AdminRole[] {
    return [
      AdminRole.SECRETAIRE,
      AdminRole.CHEF_DE_DEPARTEMENT,
      AdminRole.CHEF_DE_SPECIALITE,
      AdminRole.DOYEN,
      AdminRole.VICE_DOYEN,
    ];
  }

  /**
   * Get all roles (including ETUDIANT and ENSEIGNANT)
   * @returns Array of all roles
   */
  static getAllRoles(): AdminRole[] {
    return [
      ...this.getAdminRoles(),
      AdminRole.ETUDIANT,
      AdminRole.ENSEIGNANT,
    ];
  }

  /**
   * Check if a user has an administrative role
   * @param role The role to check
   * @returns True if the role is an administrative role, false otherwise
   */
  static isAdminRole(role: string): boolean {
    return this.getAdminRoles().includes(role as AdminRole);
  }
}
