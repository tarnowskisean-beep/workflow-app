import { PrismaClient } from "@prisma/client"
import { google } from "googleapis"

const prisma = new PrismaClient()

// Authenticating with Service Account (as this is a backend script)
// Assuming credentials are in env or typical location
// Or using key file
// For this environment, we might need to check how auth is handled. 
// "actions/user-actions.ts" implies using `googleapis` but context is auth().
// We'll try to use standard Application Default Credentials or a key file if available.
// If running locally, we might need a way to auth.

async function getDriveClient() {
    // Attempting to load from environment variable which might contain the credentials JSON
    // or path to it.
    const auth = new google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/drive.metadata.readonly'],
    });

    return google.drive({ version: 'v3', auth });
}

// Function to extract ID from Drive Link
function extractFileId(link: string): string | null {
    // Matches /d/FILE_ID/ or id=FILE_ID
    const match = link.match(/[-\w]{25,}/);
    return match ? match[0] : null;
}

async function main() {
    console.log("Starting backfill of Drive names...")

    // Fetch all workItems with a driveLink but no driveFileName
    const items = await prisma.workItem.findMany({
        where: {
            driveLink: { not: null },
            driveFileName: null
        }
    })

    console.log(`Found ${items.length} items to process.`)

    if (items.length === 0) return

    try {
        const drive = await getDriveClient();

        for (const item of items) {
            if (!item.driveLink) continue;

            const fileId = extractFileId(item.driveLink);
            if (!fileId) {
                console.log(`Could not extract ID from link: ${item.driveLink} (Item ID: ${item.id})`)
                continue;
            }

            try {
                const res = await drive.files.get({
                    fileId: fileId,
                    fields: 'name'
                })

                const fileName = res.data.name;

                if (fileName) {
                    await prisma.workItem.update({
                        where: { id: item.id },
                        data: {
                            driveFileId: fileId,
                            driveFileName: fileName
                        }
                    })
                    console.log(`Updated Item ${item.id}: ${fileName}`)
                } else {
                    console.log(`No name returned for file ID: ${fileId}`)
                }

            } catch (err: any) {
                console.error(`Error fetching metadata for ${fileId}:`, err.message)
                // If 404, maybe link is dead?
                if (err.code === 404) {
                    console.log(`File not found (404). Marking as such? Or leaving alone.`)
                }
            }

            // Sleep briefly to avoid rate limits
            await new Promise(r => setTimeout(r, 200))
        }

    } catch (authError) {
        console.error("Authentication failed. Ensure GOOGLE_APPLICATION_CREDENTIALS is set or env vars are present.", authError)
    }

    console.log("Backfill complete.")
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
