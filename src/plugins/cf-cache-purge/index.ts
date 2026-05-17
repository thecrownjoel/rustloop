/**
 * Cloudflare cache auto-purge plugin.
 *
 * Calls Cloudflare's `POST /zones/{zoneId}/purge_cache` whenever content
 * is saved, published, unpublished, or deleted — so newly-published
 * pages and posts show up immediately at the edge instead of being
 * served from a stale CDN cache.
 *
 * Configure in admin: Plugins → Cloudflare Cache Purge → Settings.
 * Required: a CF API token scoped to `Zone.Cache Purge` on this site,
 * and the zone ID. Both are stored encrypted in the plugin KV.
 *
 * Failures are logged and swallowed — a transient CF outage must
 * never block a content save.
 */

import { definePlugin } from "emdash";
import type { PluginDefinition } from "emdash";

const CF_API = "https://api.cloudflare.com/client/v4";

async function purgeCloudflareCache(ctx: any): Promise<void> {
	const enabled = (await ctx.kv.get<boolean>("settings:enabled")) ?? true;
	if (!enabled) return;

	const apiToken = await ctx.kv.get<string>("settings:apiToken");
	const zoneId = await ctx.kv.get<string>("settings:zoneId");

	if (!apiToken || !zoneId) {
		ctx.log.warn("CF purge skipped: apiToken or zoneId not configured");
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
	version: "0.1.0",

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
				label: "Cloudflare API Token",
				description:
					"Token scoped to Zone.Cache Purge on rustloop.ai. Create at dash.cloudflare.com → My Profile → API Tokens.",
			},
			zoneId: {
				type: "string",
				label: "Cloudflare Zone ID",
				description: "Found on the rustloop.ai zone overview page in the CF dashboard.",
			},
		},
	},

	hooks: {
		"plugin:install": async (_event, ctx) => {
			await ctx.kv.set("settings:enabled", true);
			ctx.log.info("cf-cache-purge installed. Configure token + zone in admin settings.");
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
