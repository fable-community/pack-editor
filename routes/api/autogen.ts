import { captureException } from '~/utils/sentry.ts';

import type { Handlers } from '$fresh/server.ts';

const ACCOUNT_ID = Deno.env.get('CF_ACCOUNT_ID');
const API_TOKEN = Deno.env.get('CF_AI_TOKEN');

export interface Data {
  characterName?: string;
  mediaTitle?: string;
}

const MODEL_ID = '@hf/mistral/mistral-7b-instruct-v0.2';

export const handler: Handlers = {
  async POST(req): Promise<Response> {
    let prompt = '';

    const data: Data = await req.json();

    if (!data.characterName && !data.mediaTitle) {
      return new Response('Character Name/Media Title not defined', {
        status: 400,
      });
    }

    if (data.characterName && data.mediaTitle) {
      prompt =
        `Create a short description for the character ${data.characterName} from ${data.mediaTitle}, keep it short and about the character personality and traits.`;
    } else if (data.characterName) {
      prompt =
        `Create a short description for the character ${data.characterName}, keep it short and about the character personality and traits.`;
    } else if (data.mediaTitle) {
      prompt = `Create a short description for ${data.mediaTitle}`;
    }

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/${MODEL_ID}`,
      {
        method: 'POST',
        headers: { 'authorization': `Bearer ${API_TOKEN}` },
        body: JSON.stringify({
          stream: true,
          prompt: `[INST]${prompt}[/INST]`,
          // messages: [{
          //   role: 'system',
          //   content:
          //     "You are a multimedia encyclopedia",
          // }, {
          //   role: 'user',
          //   content: prompt,
          // }],
        }),
      },
    );

    const stream = response.body;

    if (!response.ok || !stream) {
      const res: {
        errors: { message: string }[];
      } = await response.json();

      captureException(res.errors[0]);

      return new Response('Internal Server Error', { status: 500 });
    }

    const regex = /"response":"([^"]*)"/;

    const reStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const s = new TextDecoder().decode(chunk);
          const match = s.match(regex);

          if (match) {
            controller.enqueue(match[1]
              .replaceAll('</s>', ''));
          }
        }

        controller.enqueue('\n\n(Generated By AI)');
        controller.close();
      },
    });

    const body = reStream.pipeThrough(new TextEncoderStream());

    return new Response(body, {
      headers: { 'content-type': 'text/event-stream' },
    });
  },
};
