import { db } from './src/db/index';
import { agents } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function updateAgentsForTesting() {
    try {
        // Update agent ID 1 to be owned by a test NEAR account and public
        await db.update(agents)
            .set({
                ownerAccountId: 'utkarsharjariya.testnet',
                isPublic: true
            })
            .where(eq(agents.id, 1));

        // Update agent ID 2 to be owned by a test NEAR account but private
        await db.update(agents)
            .set({
                ownerAccountId: 'utkarsharjariya.testnet',
                isPublic: false
            })
            .where(eq(agents.id, 2));

        // Update agent ID 3 to be public but owned by another account
        await db.update(agents)
            .set({
                ownerAccountId: 'testuser.testnet',
                isPublic: true
            })
            .where(eq(agents.id, 3));

        // Update agent ID 4 to be public but owned by another account
        await db.update(agents)
            .set({
                ownerAccountId: 'anotheruser.testnet',
                isPublic: true
            })
            .where(eq(agents.id, 4));

        // Update agent ID 5 to be public but owned by another account
        await db.update(agents)
            .set({
                ownerAccountId: 'community.testnet',
                isPublic: true
            })
            .where(eq(agents.id, 5));

        console.log('✅ Agents updated successfully for testing');
        console.log('📊 utkarsharjariya.testnet now owns agents 1 (public) and 2 (private)');
        console.log('📊 Public agents: 1, 3, 4, 5 should show in browse page');
        console.log('📊 My agents for utkarsharjariya.testnet: 1, 2 should show');
    } catch (error) {
        console.error('❌ Update error:', error);
    }
}

updateAgentsForTesting();