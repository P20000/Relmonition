import { TenantDatabaseManager } from '../../tenant-manager';
import { getLLMProvider } from './providers/factory';
import * as schema from '../../db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import crypto from 'crypto';

const tenantManager = new TenantDatabaseManager();

export async function generatePersonalityProfiles(tenantId: string) {
  try {
    console.log(`[ProfileService] Generating personality profiles for tenant ${tenantId}`);
    const { client: db } = await tenantManager.getDatabaseClient(tenantId);
    
    // 1. Get Members to ensure we know who is who
    const { client: globalDb } = tenantManager.getGlobalClient();
    const members = await globalDb
      .select({
        userId: schema.tenantMembers.userId,
        userName: schema.users.name,
        email: schema.users.email
      })
      .from(schema.tenantMembers)
      .leftJoin(schema.users, eq(schema.tenantMembers.userId, schema.users.id))
      .where(eq(schema.tenantMembers.tenantId, tenantId));
    
    if (members.length === 0) return;

    const userMap = new Map(members.map(m => [m.userId, m.userName || m.email || m.userId]));

    // 2. Gather Context
    const journals = await db.select().from(schema.journalEntries)
      .where(eq(schema.journalEntries.tenantId, tenantId))
      .orderBy(desc(schema.journalEntries.createdAt))
      .limit(100);
    
    const chatContext = await db.select({ fileContent: schema.chatUploads.fileContent })
      .from(schema.chatUploads)
      .where(eq(schema.chatUploads.tenantId, tenantId))
      .limit(3);
      
    let contextString = "PARTNERS IN THIS RELATIONSHIP:\n";
    members.forEach(m => {
      contextString += `- ID: ${m.userId}, Name: ${m.userName || m.email || 'Partner'}\n`;
    });

    contextString += "\nJOURNAL ENTRIES:\n";
    journals.forEach(j => {
      const name = userMap.get(j.userId) || j.userId;
      contextString += `${name} (ID: ${j.userId}) wrote: ${j.content}\n`;
    });
    
    contextString += "\nCHAT HISTORY EXCERPTS:\n";
    chatContext.forEach(c => {
      contextString += c.fileContent.substring(0, 3000) + "\n---\n";
    });

    // 3. Prompt AI
    const prompt = `
      Based on the following relationship data (journals and chat excerpts), generate a comprehensive personality profile for each user, and a compatibility insight.
      
      DATA:
      ${contextString.substring(0, 25000)}
      
      Respond STRICTLY in the following JSON format without any markdown wrappers or code blocks:
      {
        "profiles": [
          {
            "userId": "string (MUST match the user ID from the journal entries)",
            "traits": ["trait1", "trait2"],
            "likes": ["like1", "like2"],
            "dislikes": ["dislike1"],
            "communicationStyle": "Brief description of how they communicate",
            "triggersAndTraumas": ["trigger1", "trigger2"]
          }
        ],
        "compatibility": {
          "percentage": 85,
          "summary": "Overall summary of their dynamic. IMPORTANT: Use the actual names of the partners provided in the context, NOT their IDs.",
          "growthOpportunities": ["Specific advice. IMPORTANT: Use partner names instead of IDs."]
        }
      }
    `;

    const provider = await getLLMProvider(tenantId);
    const responseText = await provider.generateText(prompt, "You are an expert relationship psychologist. Output ONLY valid JSON, no markdown formatting.");
    
    // 4. Parse & Save
    const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(jsonStr);
    
    // Save Profiles
    if (data.profiles && Array.isArray(data.profiles)) {
      for (const p of data.profiles) {
        if (!p.userId) continue;
        
        const existing = await db.select().from(schema.partnerProfiles).where(eq(schema.partnerProfiles.userId, p.userId)).limit(1);
        
        let finalLikes = p.likes || [];
        let finalDislikes = p.dislikes || [];
        
        if (existing.length > 0) {
           // Merge manual edits
           try {
             const oldLikes = JSON.parse(existing[0].likes);
             const oldDislikes = JSON.parse(existing[0].dislikes);
             finalLikes = Array.from(new Set([...oldLikes, ...finalLikes]));
             finalDislikes = Array.from(new Set([...oldDislikes, ...finalDislikes]));
           } catch(e) {}
           
           await db.update(schema.partnerProfiles).set({
             traits: JSON.stringify(p.traits || []),
             likes: JSON.stringify(finalLikes),
             dislikes: JSON.stringify(finalDislikes),
             communicationStyle: p.communicationStyle || "",
             triggersAndTraumas: JSON.stringify(p.triggersAndTraumas || []),
             lastSyncedJournalCount: journals.length,
             updatedAt: new Date()
           }).where(eq(schema.partnerProfiles.id, existing[0].id));
        } else {
           await db.insert(schema.partnerProfiles).values({
             id: crypto.randomUUID(),
             tenantId,
             userId: p.userId,
             traits: JSON.stringify(p.traits || []),
             likes: JSON.stringify(finalLikes),
             dislikes: JSON.stringify(finalDislikes),
             communicationStyle: p.communicationStyle || "",
             triggersAndTraumas: JSON.stringify(p.triggersAndTraumas || []),
             lastSyncedJournalCount: journals.length,
             updatedAt: new Date()
           });
        }
      }
    }
    
    // Save Compatibility
    if (data.compatibility) {
       const existingComp = await db.select().from(schema.compatibilityInsights).where(eq(schema.compatibilityInsights.tenantId, tenantId)).limit(1);
       if (existingComp.length > 0) {
         await db.update(schema.compatibilityInsights).set({
           compatibilityPercentage: data.compatibility.percentage || 0,
           summary: data.compatibility.summary || "",
           growthOpportunities: JSON.stringify(data.compatibility.growthOpportunities || []),
           updatedAt: new Date()
         }).where(eq(schema.compatibilityInsights.tenantId, tenantId));
       } else {
         await db.insert(schema.compatibilityInsights).values({
           id: crypto.randomUUID(),
           tenantId,
           compatibilityPercentage: data.compatibility.percentage || 0,
           summary: data.compatibility.summary || "",
           growthOpportunities: JSON.stringify(data.compatibility.growthOpportunities || []),
           updatedAt: new Date()
         });
       }
    }
    console.log(`[ProfileService] Successfully updated profiles for tenant ${tenantId}`);
  } catch (err) {
    console.error("[ProfileService] Failed to parse or save personality JSON:", err);
  }
}

export async function checkAndSyncProfiles(tenantId: string) {
  try {
    const { client: db } = await tenantManager.getDatabaseClient(tenantId);
    const profiles = await db.select().from(schema.partnerProfiles).where(eq(schema.partnerProfiles.tenantId, tenantId)).limit(1);
    const journalsCount = await db.select({ count: sql<number>`count(*)` }).from(schema.journalEntries).where(eq(schema.journalEntries.tenantId, tenantId));
    const currentCount = journalsCount[0]?.count || 0;
    
    if (profiles.length === 0) {
      if (currentCount > 0) {
        console.log(`[ProfileService] Initial sync triggered for tenant ${tenantId}`);
        await generatePersonalityProfiles(tenantId);
      }
    } else {
      const lastSync = profiles[0].lastSyncedJournalCount || 0;
      if (currentCount - lastSync >= 3) {
         console.log(`[ProfileService] Smart sync triggered for tenant ${tenantId} (delta: ${currentCount - lastSync})`);
         await generatePersonalityProfiles(tenantId);
      }
    }
  } catch (err) {
    console.error("[ProfileService] Check and sync failed:", err);
  }
}
