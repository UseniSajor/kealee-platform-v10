
import { prisma } from '../../core/db';
import { addWorkingDays } from '../../core/utils';

export class CredentialVerifier {
    async verifyContractor(contractorId: string): Promise<{
        isVerified: boolean;
        issues: string[];
        credentials: Array<{ type: string; status: string; expiresAt?: Date }>;
    }> {
        const contractor = await prisma.contractor.findUniqueOrThrow({
            where: { id: contractorId },
            include: { credentials: true },
        });

        const issues: string[] = [];
        const now = new Date();

        const credentials = contractor.credentials.map(cred => {
            let status = 'VALID';

            if (cred.expiresAt && cred.expiresAt < now) {
                status = 'EXPIRED';
                issues.push(`${cred.type} expired on ${cred.expiresAt.toLocaleDateString()}`);
            } else if (cred.expiresAt && cred.expiresAt < addWorkingDays(now, 30)) {
                status = 'EXPIRING_SOON';
                issues.push(`${cred.type} expires on ${cred.expiresAt.toLocaleDateString()}`);
            }

            return { type: cred.type, status, expiresAt: cred.expiresAt || undefined };
        });

        const requiredTypes = ['LICENSE', 'GENERAL_LIABILITY', 'WORKERS_COMP'];
        for (const required of requiredTypes) {
            const found = credentials.find(c =>
                c.type.toUpperCase().includes(required) && c.status === 'VALID'
            );
            if (!found) {
                issues.push(`Missing or invalid ${required.replace('_', ' ')}`);
            }
        }

        return { isVerified: issues.length === 0, issues, credentials };
    }
}
