/**
 * Cloudflare cache auto-purge plugin.
 *
 * Calls Cloudflare's `POST /zones/{zoneId}/purge_cache` whenever content
 * is saved, published, unpublished, or deleted — so newly-published
 * pages and posts show up immediately at the edge instead of being
 * served from a stale CDN cache.
 *
 * Configuration order of precedence (first match wins):
 *   1. Worker env vars: CF_PURGE_TOKEN + CF_ZONE_ID
 *        - Set via `wrangler secret put CF_PURGE_TOKEN`
 *        - Zone ID lives in wrangler.jsonc `vars`
 *   2. Plugin KV settings (encrypted) as a fallback override
 *
 * Failures are logged and swallowed — a transient CF outage must
 * never block a content save.
 */

import { definePlugin } from "emdash";
import type { PluginDefinition } from "emdash";

const CF_API = "https://api.cloudflare.com/client/v4";

function readEnv(key: string): string | undefined {
	// `process.env` works in Cloudflare Workers when nodejs_compat is enabled.
	const fromProcess = typeof process !== "undefined" ? process.env?.[key] : undefined;
	if (fromProcess) return fromProcess;
	// Fall back to globalThis (Workers bind vars/secrets there too).
	const fromGlobal = (globalThis as Record<string, unknown>)[key];
	return typeof fromGlobal === "string" ? fromGlobal : undefined;
}

async function resolveConfig(ctx: any) {
	const apiToken = readEnv("CF_PURGE_TOKEN") ?? (await ctx.kv.get<string>("settings:apiToken"));
	const zoneId = readEnv("CF_ZONE_ID") ?? (await ctx.kv.get<string>("settings:zoneId"));
	return { apiToken, zoneId };
}

async function purgeCloudflareCache(ctx: any): Promise<void> {
	const enabled = (await ctx.kv.get<boolean>("settings:enabled")) ?? true;
	if (!enabled) return;

	const { apiToken, zoneId } = await resolveConfig(ctx);

	if (!apiToken || !zoneId) {
		ctx.log.warn("CF purge skipped: CF_PURGE_TOKEN or CF_ZONE_ID not set");
		return;
	}

	if (!ctx.http) {
		ctx.log.warn("CF purge skipped: network capability not available");
		return;
	}

	try {
		const response = await ctx.http.fetch(`${CF_API}/zones/${zoneId}/purge_cache`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiToken}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ purge_everything: true }),
		});

		if (!response.ok) {
			const body = await response.text();
			ctx.log.warn(`CF purge failed: ${response.status} ${body}`);
			return;
		}

		await ctx.kv.set("state:lastPurgeAt", new Date().toISOString());
		ctx.log.info("CF cache purged");
	} catch (err) {
		ctx.log.warn(`CF purge error: ${(err as Error).message}`);
	}
}

const definition: PluginDefinition = {
	id: "cf-cache-purge",
	version: "0.2.0",

	capabilities: ["network:request"],
	allowedHosts: ["api.cloudflare.com"],

	admin: {
		settingsSchema: {
			enabled: {
				type: "boolean",
				label: "Enabled",
				description: "Auto-purge Cloudflare cache on content changes",
				default: true,
			},
			apiToken: {
				type: "secret",
				label: "API Token (override)",
				description:
					"Optional override. Prefer setting CF_PURGE_TOKEN as a Worker secret via `wrangler secret put CF_PURGE_TOKEN`.",
			},
			zoneId: {
				type: "string",
				label: "Zone ID (override)",
				description:
					"Optional override. Default comes from CF_ZONE_ID in wrangler.jsonc vars.",
			},
		},
	},

	hooks: {
		"plugin:install": async (_event, ctx) => {
			await ctx.kv.set("settings:enabled", true);
			ctx.log.info("cf-cache-purge installed");
		},

		"content:afterSave": async (_event, ctx) => {
			await purgeCloudflareCache(ctx);
		},

		"content:afterPublish": async (_event, ctx) => {
			await purgeCloudflareCache(ctx);
		},

		"content:afterUnpublish": async (_event, ctx) => {
			await purgeCloudflareCache(ctx);
		},

		"content:afterDelete": async (_event, ctx) => {
			await purgeCloudflareCache(ctx);
		},
	},
};

export default definePlugin(definition);
