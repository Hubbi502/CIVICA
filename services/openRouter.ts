import { Personas } from '@/constants/personas';
import { AIClassification, ChatMessage, PersonaType, PostType, QuickAction, SeverityLevel } from '@/types';
import { OpenRouter } from '@openrouter/sdk';

const openrouter = new OpenRouter({
    apiKey: process.env.EXPO_PUBLIC_OPENROUTER_API_KEY,
});

const MODEL = 'xiaomi/mimo-v2-flash:free';

const imageToBase64 = async (uri: string): Promise<string> => {
    const response = await fetch(uri);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

export const classifyPost = async (
    images: string[],
    text: string
): Promise<AIClassification> => {
    try {
        const prompt = `
Analyze this social media post for a civic engagement app in Indonesia.

Post Text: "${text}"

Based on the text${images.length > 0 ? ' and attached image(s)' : ''}, classify this post into ONE of these categories:
1. REPORT - Infrastructure issues (potholes, flooding, broken lights), safety concerns, public facility problems
2. PROMOTION - Business promotions, product offerings, services, local shops/restaurants
3. NEWS - Local news, announcements, events, community information
4. GENERAL - Casual posts that don't fit above categories

Also analyze:
- Confidence score (0-1)
- Severity level if it's a REPORT (low/medium/high/critical)
- Relevant tags (max 5, in Indonesian)
- Key keywords extracted from the content

Respond in valid JSON format only:
{
  "category": "REPORT" | "PROMOTION" | "NEWS" | "GENERAL",
  "confidence": 0.0-1.0,
  "severity": "low" | "medium" | "high" | "critical" | null,
  "tags": ["tag1", "tag2"],
  "keywords": ["keyword1", "keyword2"],
  "sentiment": "positive" | "neutral" | "negative"
}
`;

        const messages: { role: string; content: string }[] = [];

        if (images.length > 0) {
            messages.push({
                role: 'user',
                content: prompt + '\n\n[User has attached ' + images.length + ' image(s)]'
            });
        } else {
            messages.push({ role: 'user', content: prompt });
        }

        const response = await openrouter.chat.send({
            model: MODEL,
            messages: messages as any,
        });

        const content = response.choices?.[0]?.message?.content;
        const responseText = typeof content === 'string' ? content : '';

        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No valid JSON in response');
        }

        const parsed = JSON.parse(jsonMatch[0]);

        return {
            category: parsed.category as PostType,
            confidence: parsed.confidence,
            severity: parsed.severity as SeverityLevel | undefined,
            tags: parsed.tags || [],
            keywords: parsed.keywords || [],
            sentiment: parsed.sentiment,
        };
    } catch (error) {
        console.error('AI Classification error:', error);

        return {
            category: 'GENERAL',
            confidence: 0.5,
            tags: [],
            keywords: [],
        };
    }
};

export const analyzeImage = async (imageUri: string): Promise<{
    description: string;
    suggestedCategory: PostType;
    detectedObjects: string[];
}> => {
    try {
        const base64Image = await imageToBase64(imageUri);

        const prompt = `
Analyze this image from a civic engagement app in Indonesia.
Describe what you see briefly and suggest if this might be:
- Infrastructure issue (pothole, damage, flooding, etc.)
- Business/product
- News/event
- General content

Respond in JSON:
{
  "description": "Brief description",
  "suggestedCategory": "REPORT" | "PROMOTION" | "NEWS" | "GENERAL",
  "detectedObjects": ["object1", "object2"]
}
`;

        const response = await openrouter.chat.send({
            model: MODEL,
            messages: [
                {
                    role: 'user',
                    content: prompt + '\n\n[Image analysis requested]',
                },
            ] as any,
        });

        const content = response.choices?.[0]?.message?.content;
        const responseText = typeof content === 'string' ? content : '';

        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No valid JSON in response');
        }

        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error('Image analysis error:', error);
        return {
            description: 'Unable to analyze image',
            suggestedCategory: 'GENERAL',
            detectedObjects: [],
        };
    }
};

export const parseInterests = async (text: string): Promise<{
    interests: string[];
    suggestedTags: string[];
}> => {
    try {
        const prompt = `
Given this user's description of their interests (in Indonesian context):
"${text}"

Extract the key interests and suggest relevant tags for a civic engagement app.

Respond in JSON:
{
  "interests": ["interest1", "interest2", "interest3"],
  "suggestedTags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}

Keep interests concise (1-2 words each). Maximum 5 interests and 5 tags.
`;

        const response = await openrouter.chat.send({
            model: MODEL,
            messages: [{ role: 'user', content: prompt }] as any,
        });

        const content = response.choices?.[0]?.message?.content;
        const responseText = typeof content === 'string' ? content : '';

        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No valid JSON in response');
        }

        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error('Interest parsing error:', error);
        return {
            interests: [],
            suggestedTags: [],
        };
    }
};

/**
 * Get chatbot response
 */
export const getChatResponse = async (
    messages: ChatMessage[],
    context: {
        persona: PersonaType;
        location: { city: string; district: string };
        timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    }
): Promise<string> => {
    try {
        const personaInfo = Personas[context.persona];

        const systemPrompt = `
Kamu adalah asisten virtual CIVICA, aplikasi civic engagement di Indonesia.

Profil pengguna:
- Persona: ${personaInfo.name}
- Lokasi: ${context.location.district}, ${context.location.city}
- Waktu: ${context.timeOfDay}

Kemampuanmu:
- Membantu cari tempat terdekat (restoran, kafe, layanan)
- Cek laporan dan masalah lokal
- Bantu buat laporan baru
- Info bisnis lokal dan UMKM
- Info kota dan event

ATURAN PENTING:
1. JANGAN gunakan format markdown apapun (seperti **, *, #, dll)
2. Tulis dengan gaya percakapan santai dan natural seperti teman
3. Gunakan emoji secukupnya untuk membuat chat lebih hidup
4. Jawab singkat dan to the point, tidak perlu terlalu formal
5. Gunakan bahasa Indonesia sehari-hari yang ramah
6. Jika merekomendasikan tempat, sebutkan perkiraan jarak dan harga dengan natural

Contoh gaya bicara yang benar:
"Hai! Ada beberapa kedai kopi enak di sekitar Dago nih. Kopi Tuku sekitar 500m dari kamu, harganya 15-25rb. Mau aku carikan yang lebih spesifik?"

Contoh yang SALAH (jangan seperti ini):
"**Rekomendasi Kopi:**
1. **Kopi Tuku** - *500m*"
`;

        const conversationMessages = [
            { role: 'system', content: systemPrompt },
            ...messages.slice(-10).map((m) => ({
                role: m.role === 'user' ? 'user' : 'assistant',
                content: m.content,
            })),
        ];

        const response = await openrouter.chat.send({
            model: MODEL,
            messages: conversationMessages as any,
        });

        const content = response.choices?.[0]?.message?.content;
        return typeof content === 'string' ? content : 'Maaf, terjadi kesalahan. Silakan coba lagi.';
    } catch (error) {
        console.error('Chat response error:', error);
        return 'Maaf, terjadi kesalahan. Silakan coba lagi.';
    }
};

/**
 * Generate context-aware quick actions
 */
export const generateQuickActions = (
    persona: PersonaType,
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
): QuickAction[] => {
    const baseActions: QuickAction[] = [
        {
            id: 'nearby_food',
            icon: 'utensils',
            label: timeOfDay === 'morning' ? 'Sarapan terdekat' :
                timeOfDay === 'afternoon' ? 'Makan siang terdekat' :
                    'Makan malam terdekat',
            prompt: `Rekomendasikan tempat ${timeOfDay === 'morning' ? 'sarapan' :
                timeOfDay === 'afternoon' ? 'makan siang' :
                    'makan malam'
                } terdekat`,
        },
        {
            id: 'traffic',
            icon: 'car',
            label: 'Cek lalu lintas',
            prompt: 'Bagaimana kondisi lalu lintas saat ini?',
        },
        {
            id: 'create_report',
            icon: 'alert-triangle',
            label: 'Buat laporan',
            prompt: 'Saya ingin melaporkan masalah',
        },
        {
            id: 'city_news',
            icon: 'newspaper',
            label: 'Berita hari ini',
            prompt: 'Apa berita terbaru di kota ini?',
        },
    ];

    const personaActions: Record<PersonaType, QuickAction[]> = {
        merchant: [
            {
                id: 'promote',
                icon: 'megaphone',
                label: 'Promosikan bisnis',
                prompt: 'Bantu saya membuat promosi untuk bisnis saya',
            },
        ],
        office_worker: [
            {
                id: 'coffee',
                icon: 'coffee',
                label: 'Kopi terdekat',
                prompt: 'Rekomendasikan cafe atau coffee shop terdekat',
            },
        ],
        resident: [
            {
                id: 'community',
                icon: 'users',
                label: 'Info komunitas',
                prompt: 'Ada info atau event komunitas terbaru?',
            },
        ],
        student: [
            {
                id: 'study',
                icon: 'book-open',
                label: 'Tempat belajar',
                prompt: 'Rekomendasikan tempat belajar yang nyaman',
            },
        ],
    };

    return [...baseActions, ...(personaActions[persona] || [])];
};

/**
 * Get time of day from current hour
 */
export const getTimeOfDay = (): 'morning' | 'afternoon' | 'evening' | 'night' => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return 'morning';
    if (hour >= 11 && hour < 15) return 'afternoon';
    if (hour >= 15 && hour < 19) return 'evening';
    return 'night';
};
