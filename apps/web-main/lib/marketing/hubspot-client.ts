/**
 * HubSpot Client — Lead Management & CRM Sync
 * Replaces GoHighLevel integration
 */

interface HubSpotContact {
  email: string;
  firstname?: string;
  lastname?: string;
  phone?: string;
  hs_lead_status?: string;
  lifecyclestage?: string;
  lead_source?: string;
  budget?: string;
  timeline?: string;
  project_type?: string;
  hot_lead?: boolean;
  lead_score?: number;
  [key: string]: any;
}

interface HubSpotDeal {
  dealname: string;
  dealstage: string;
  dealtype?: string;
  amount?: number;
  associations?: {
    associatedVids?: number[];
  };
  [key: string]: any;
}

const HUBSPOT_API_BASE = "https://api.hubapi.com";
const HUBSPOT_API_KEY = process.env.HUBSPOT_API_KEY;

if (!HUBSPOT_API_KEY) {
  console.warn("⚠️  HUBSPOT_API_KEY not set. HubSpot integration disabled.");
}

/**
 * Create or update a contact in HubSpot
 */
export async function createOrUpdateContact(
  email: string,
  properties: HubSpotContact
): Promise<{ id: string; email: string; created: boolean }> {
  if (!HUBSPOT_API_KEY) {
    throw new Error("HUBSPOT_API_KEY not configured");
  }

  try {
    const response = await fetch(
      `${HUBSPOT_API_BASE}/crm/v3/objects/contacts`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${HUBSPOT_API_KEY}`,
        },
        body: JSON.stringify({
          properties: {
            ...properties,
            email,
          },
        }),
      }
    );

    if (!response.ok) {
      // If contact exists, try to update it
      if (response.status === 409) {
        return await updateContactByEmail(email, properties);
      }
      throw new Error(`HubSpot API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      id: data.id,
      email,
      created: true,
    };
  } catch (error) {
    console.error("❌ HubSpot createOrUpdateContact error:", error);
    throw error;
  }
}

/**
 * Update an existing contact by email
 */
export async function updateContactByEmail(
  email: string,
  properties: HubSpotContact
): Promise<{ id: string; email: string; created: boolean }> {
  if (!HUBSPOT_API_KEY) {
    throw new Error("HUBSPOT_API_KEY not configured");
  }

  try {
    // First, get the contact ID by email
    const getResponse = await fetch(
      `${HUBSPOT_API_BASE}/crm/v3/objects/contacts/search`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${HUBSPOT_API_KEY}`,
        },
        body: JSON.stringify({
          filterGroups: [
            {
              filters: [
                {
                  propertyName: "email",
                  operator: "EQ",
                  value: email,
                },
              ],
            },
          ],
          limit: 1,
        }),
      }
    );

    const searchData = await getResponse.json();
    const contactId = searchData.results?.[0]?.id;

    if (!contactId) {
      throw new Error(`Contact not found: ${email}`);
    }

    // Now update the contact
    const updateResponse = await fetch(
      `${HUBSPOT_API_BASE}/crm/v3/objects/contacts/${contactId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${HUBSPOT_API_KEY}`,
        },
        body: JSON.stringify({
          properties,
        }),
      }
    );

    if (!updateResponse.ok) {
      throw new Error(`HubSpot update error: ${updateResponse.status}`);
    }

    return {
      id: contactId,
      email,
      created: false,
    };
  } catch (error) {
    console.error("❌ HubSpot updateContactByEmail error:", error);
    throw error;
  }
}

/**
 * Create a deal in HubSpot
 */
export async function createDeal(
  dealData: HubSpotDeal,
  contactId?: string
): Promise<{ id: string }> {
  if (!HUBSPOT_API_KEY) {
    throw new Error("HUBSPOT_API_KEY not configured");
  }

  try {
    const response = await fetch(`${HUBSPOT_API_BASE}/crm/v3/objects/deals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${HUBSPOT_API_KEY}`,
      },
      body: JSON.stringify({
        properties: dealData,
        associations: contactId
          ? [
              {
                types: [{ associationCategory: "HUBSPOTDEFINED", associationTypeId: 3 }],
                id: contactId,
              },
            ]
          : [],
      }),
    });

    if (!response.ok) {
      throw new Error(`HubSpot deal creation error: ${response.status}`);
    }

    const data = await response.json();
    return { id: data.id };
  } catch (error) {
    console.error("❌ HubSpot createDeal error:", error);
    throw error;
  }
}

/**
 * Get all contacts (for analytics/reporting)
 */
export async function getAllContacts(limit = 100): Promise<any[]> {
  if (!HUBSPOT_API_KEY) {
    throw new Error("HUBSPOT_API_KEY not configured");
  }

  try {
    const response = await fetch(
      `${HUBSPOT_API_BASE}/crm/v3/objects/contacts?limit=${limit}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${HUBSPOT_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HubSpot API error: ${response.status}`);
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error("❌ HubSpot getAllContacts error:", error);
    throw error;
  }
}

/**
 * Search contacts by property
 */
export async function searchContacts(
  propertyName: string,
  value: string
): Promise<any[]> {
  if (!HUBSPOT_API_KEY) {
    throw new Error("HUBSPOT_API_KEY not configured");
  }

  try {
    const response = await fetch(
      `${HUBSPOT_API_BASE}/crm/v3/objects/contacts/search`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${HUBSPOT_API_KEY}`,
        },
        body: JSON.stringify({
          filterGroups: [
            {
              filters: [
                {
                  propertyName,
                  operator: "EQ",
                  value,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HubSpot search error: ${response.status}`);
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error("❌ HubSpot searchContacts error:", error);
    throw error;
  }
}

/**
 * Verify HubSpot connection (test endpoint)
 */
export async function verifyConnection(): Promise<boolean> {
  if (!HUBSPOT_API_KEY) {
    console.warn("⚠️  HUBSPOT_API_KEY not set");
    return false;
  }

  try {
    const response = await fetch(`${HUBSPOT_API_BASE}/crm/v3/objects/contacts?limit=1`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${HUBSPOT_API_KEY}`,
      },
    });

    if (!response.ok) {
      console.error("❌ HubSpot connection failed:", response.status);
      return false;
    }

    console.log("✅ HubSpot connection successful");
    return true;
  } catch (error) {
    console.error("❌ HubSpot verification error:", error);
    return false;
  }
}
