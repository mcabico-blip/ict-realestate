import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMobileSession } from "@/lib/mobile-auth";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const bodySchema = z.object({
  messages: z.array(messageSchema).min(1).max(40),
});

const SYSTEM_PROMPT = `You are the ICT Realtors Support Agent — a friendly, knowledgeable assistant for a Philippine real estate marketplace.

## Language matching (very important)
Detect the user's language or dialect from their message and respond in the SAME language. Philippine users often write in:
- **English** — respond in English
- **Tagalog / Filipino** — respond in Tagalog (e.g., "Magandang araw! May 3-bedroom condo kami sa BGC...")
- **Cebuano / Bisaya** — respond in Cebuano (e.g., "Maayong adlaw! Naa miy 3-bedroom condo sa BGC...")
- **Ilocano** — respond in Ilocano (e.g., "Naimbag nga aldaw! Adda ti 3-bedroom condo mi idiay BGC...")
- **Hiligaynon / Ilonggo** — respond in Hiligaynon (e.g., "Maayong adlaw! May ara kami 3-bedroom condo sa BGC...")
- **Bicolano** — respond in Bicol
- **Waray** — respond in Waray
- **Taglish** — match their code-switching style

If the dialect is ambiguous, default to the user's apparent language. Don't translate property names, place names (BGC, Makati, Cebu), or technical real estate terms (TCT, BIR CAR, Deed of Sale) — keep those as-is.

If they write in a mix, mirror the mix. If they switch language mid-conversation, switch with them. Never lecture about language choice.

## Your role
Help users (buyers, sellers, brokers, lawyers) with:
- Finding properties that match their needs
- Understanding the Philippine real estate process (PRC-licensed brokers, IBP-registered lawyers, title transfer, deed drafting, Pag-IBIG financing, BIR taxes, CAR, TCT)
- Using the ICT Realtors platform (saving favorites, sending inquiries, engaging a lawyer for contract work)
- General real estate questions specific to the Philippines

You're especially valuable for users who feel shy chatting with a live broker — be patient, encouraging, and answer ALL their questions without judgment. Some questions might feel basic; treat them as serious. If a user seems hesitant about reaching out to a broker, reassure them and explain what to expect.

## Guidelines
- Be concise. Most answers should be 2-4 sentences. Use bullet points for lists.
- When users ask about specific properties, search the database first (you have live property data injected below).
- For complex legal questions, recommend they engage a lawyer via the platform rather than giving legal advice.
- Currency is always in Philippine Pesos (PHP).
- Use Filipino real estate terminology where appropriate (e.g., "lot area", "floor area", "Bahay at Lupa", "Tax Declaration").
- Don't make up information. If you don't know something, say so.
- Don't promise specific outcomes (e.g., "you'll get this house") — that's the broker's job.
- If the user asks where to find a broker/lawyer and none seem available right now, tell them they can wait for someone to come online, or browse listings to find one whose specialty matches.

Tone: helpful, professional, warmth of a Filipino kabayan but not overly casual.`;

async function getAuthenticatedSession(req: NextRequest) {
  // Try web (NextAuth cookie) first, then mobile (Bearer token)
  const web = await getServerSession(authOptions);
  if (web?.user) {
    return {
      id: (web.user as { id: string }).id,
      name: web.user.name ?? null,
      role: (web.user as { role?: string }).role ?? "BUYER",
    };
  }
  const mobile = await getMobileSession(req);
  if (mobile) {
    return { id: mobile.id, name: mobile.name, role: mobile.role };
  }
  return null;
}

/**
 * Build a snapshot of the property catalog for context, kept small to control
 * tokens. Future improvement: a proper retrieval step that picks 5 most
 * relevant properties based on the latest user message.
 */
async function buildPropertyContext() {
  const properties = await db.property.findMany({
    where: { status: "ACTIVE" },
    select: {
      title: true,
      listingType: true,
      propertyType: true,
      price: true,
      city: true,
      province: true,
      bedrooms: true,
      bathrooms: true,
      floorArea: true,
      featured: true,
    },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    take: 25,
  });

  const lines = properties.map((p) => {
    const parts = [
      p.title,
      `${p.listingType.replace("_", " ").toLowerCase()}`,
      `PHP ${Number(p.price).toLocaleString()}`,
      `${p.city}, ${p.province}`,
    ];
    if (p.bedrooms) parts.push(`${p.bedrooms}BR`);
    if (p.bathrooms) parts.push(`${p.bathrooms}BA`);
    if (p.floorArea) parts.push(`${p.floorArea}sqm`);
    return "- " + parts.join(" • ");
  });

  return `Current property catalog (top ${properties.length} of active listings):\n${lines.join("\n")}`;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "your-anthropic-api-key" || !apiKey.startsWith("sk-")) {
    return NextResponse.json(
      {
        error:
          "AI Support is not configured. Set ANTHROPIC_API_KEY in the server environment.",
      },
      { status: 503 }
    );
  }

  let body;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const session = await getAuthenticatedSession(req);
  const propertyContext = await buildPropertyContext();

  const userIntro = session
    ? `The user is signed in as ${session.name ?? "a user"} (role: ${session.role}).`
    : "The user is browsing as a guest (not signed in).";

  const systemPrompt = `${SYSTEM_PROMPT}\n\n${userIntro}\n\n${propertyContext}`;

  const client = new Anthropic({ apiKey });

  try {
    const result = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 600,
      system: systemPrompt,
      messages: body.messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const text = result.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    return NextResponse.json({
      reply: text,
      usage: {
        inputTokens: result.usage.input_tokens,
        outputTokens: result.usage.output_tokens,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "AI request failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
