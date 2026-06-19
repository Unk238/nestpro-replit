import { Router } from "express";
import { db, propertiesTable, guestsTable, paymentsTable, complaintsTable, bedsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

async function getBusinessContext(): Promise<string> {
  try {
    const allProperties = await db.select().from(propertiesTable);
    const activeGuests = await db
      .select()
      .from(guestsTable)
      .where(eq(guestsTable.status, "active"));
    const pendingPayments = await db
      .select()
      .from(paymentsTable)
      .where(eq(paymentsTable.status, "pending"));
    const openComplaints = await db
      .select()
      .from(complaintsTable)
      .where(sql`${complaintsTable.status} NOT IN ('resolved','closed')`);
    const totalBeds = await db
      .select({ count: sql<number>`count(*)` })
      .from(bedsTable);
    const occupiedBeds = await db
      .select({ count: sql<number>`count(*)` })
      .from(bedsTable)
      .where(eq(bedsTable.status, "occupied"));

    return `
You are NestPro AI Receptionist — a smart business copilot for an Indian PG/hostel owner.

Current business snapshot:
- Properties: ${allProperties.length} (${allProperties.map((p) => p.name).join(", ") || "none yet"})
- Active guests: ${activeGuests.length}
- Total beds: ${totalBeds[0]?.count ?? 0} | Occupied: ${occupiedBeds[0]?.count ?? 0}
- Pending payments: ${pendingPayments.length}
- Open complaints: ${openComplaints.length}

Properties:
${allProperties.map((p) => `  • ${p.name} | ${p.city}, ${p.state}`).join("\n") || "  None yet"}

Active guests (first 10):
${activeGuests.slice(0, 10).map((g) => `  • ${g.name} | ${g.phone} | Bed #${g.bedId}`).join("\n") || "  None yet"}

Pending payments (first 10):
${pendingPayments.slice(0, 10).map((p) => `  • Guest #${p.guestId} | ₹${p.amount} | ${p.month}/${p.year}`).join("\n") || "  None"}

Open complaints (first 5):
${openComplaints.slice(0, 5).map((c) => `  • ${c.title} (${c.status})`).join("\n") || "  None"}

Instructions:
- Answer concisely and helpfully. Use ₹ for currency.
- When asked to generate messages (WhatsApp, SMS, reminders), write them in ready-to-send format.
- If data is missing, say so clearly rather than guessing.
    `.trim();
  } catch {
    return "You are NestPro AI Receptionist — a smart copilot for an Indian PG/hostel owner. Help the owner manage guests, payments, complaints, and rooms.";
  }
}

router.post("/ai/chat", async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    res.status(503).json({
      error: "AI Receptionist is not configured yet. Add your OPENAI_API_KEY in the Replit Secrets tab to enable this feature.",
    });
    return;
  }

  const { messages } = req.body as { messages: { role: string; content: string }[] };
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "messages array is required" });
    return;
  }

  try {
    const systemPrompt = await getBusinessContext();

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.slice(-20),
        ],
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const msg = (err as any)?.error?.message ?? `OpenAI error ${response.status}`;
      res.status(502).json({ error: msg });
      return;
    }

    const data = (await response.json()) as { choices: { message: { content: string } }[] };
    const reply = data.choices?.[0]?.message?.content ?? "I couldn't generate a response. Please try again.";
    res.json({ message: reply });
  } catch (err: unknown) {
    req.log.error(err, "AI chat error");
    res.status(500).json({ error: "Failed to reach OpenAI. Please try again." });
  }
});

export default router;
