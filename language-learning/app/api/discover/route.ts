import { NextRequest, NextResponse } from "next/server";
import { supabase as supabaseClient } from "@/lib/supabaseClient";

type DiscoverRow = {
  user_id: string;
  language_id: number;
  level: string | null;
  profiles: {
    first_name: string | null;
    native_language: string | null;
    updated_at: string | null;
  } | null;
  lang: {
    name: string | null;
  } | null;
};

type UserTargetRow = {
  language_id: number;
  level: string | null;
  lang: {
    name: string | null;
  } | null;
};

type CandidateTarget = {
  language_id: number;
  name: string;
  level: string;
};

type Candidate = {
  id: string;
  first_name: string | null;
  native_language: string | null;
  updated_at: string | null;
  targets: CandidateTarget[];
};

const LEVEL_RANK: Record<string, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
};

function normalizeLanguage(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function toDisplayLevel(level: string | null | undefined): string {
  if (!level) return "Beginner";
  return level.charAt(0).toUpperCase() + level.slice(1);
}

function rankLevel(level: string | null | undefined): number {
  return LEVEL_RANK[(level ?? "").toLowerCase()] ?? 0;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const languageFilter = searchParams.get("language");
  const levelFilter = searchParams.get("level");
  const isRecommended = searchParams.get("recommended") === "true";
  const currentUserId = searchParams.get("currentUserId");
  const excludeUserIdsParam = searchParams.get("excludeUserIds");

  let query = supabaseClient
    .from("profile_target_languages")
    .select(`
      user_id,
      language_id,
      level,
      profiles!inner(first_name, native_language, updated_at),
      lang:languages!profile_target_languages_language_id_fkey!inner(name)
    `);

  if (levelFilter && levelFilter !== "All") {
    query = query.eq("level", levelFilter.toLowerCase());
  }

  if (languageFilter && languageFilter.trim() !== "") {
    query = query.eq("lang.name", languageFilter.trim());
  }

  const { data: profiles, error } = await query;

  if (error) {
    console.error("Supabase Query Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const grouped = new Map<string, Candidate>();
  for (const row of (profiles as DiscoverRow[]) ?? []) {
    const existing = grouped.get(row.user_id);
    const nextTarget: CandidateTarget = {
      language_id: row.language_id,
      name: row.lang?.name ?? "None",
      level: (row.level ?? "beginner").toLowerCase(),
    };

    if (!existing) {
      grouped.set(row.user_id, {
        id: row.user_id,
        first_name: row.profiles?.first_name ?? null,
        native_language: row.profiles?.native_language ?? null,
        updated_at: row.profiles?.updated_at ?? null,
        targets: [nextTarget],
      });
      continue;
    }

    existing.targets.push(nextTarget);
  }

  const excludedUserIds = new Set<string>(
    (excludeUserIdsParam ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
  );

  if (currentUserId) excludedUserIds.add(currentUserId);

  let userNativeNorm = "";
  const userTargets = new Map<number, { name: string; level: string }>();
  const userTargetNameSet = new Set<string>();

  if (currentUserId) {
    const { data: userProfile } = await supabaseClient
      .from("profiles")
      .select("native_language")
      .eq("user_id", currentUserId)
      .maybeSingle();

    userNativeNorm = normalizeLanguage(userProfile?.native_language ?? "");

    const { data: userTargetRows } = await supabaseClient
      .from("profile_target_languages")
      .select("language_id, level, lang:languages!profile_target_languages_language_id_fkey(name)")
      .eq("user_id", currentUserId);

    for (const row of (userTargetRows as UserTargetRow[]) ?? []) {
      const targetName = row.lang?.name ?? "";
      const normalizedTargetName = normalizeLanguage(targetName);
      userTargets.set(row.language_id, {
        name: targetName,
        level: (row.level ?? "beginner").toLowerCase(),
      });
      if (normalizedTargetName) userTargetNameSet.add(normalizedTargetName);
    }
  }

  const hasRankingContext = Boolean(userNativeNorm) && userTargets.size > 0;
  const userTargetIdSet = new Set<number>([...userTargets.keys()]);

  const scored = [...grouped.values()]
    .filter((candidate) => !excludedUserIds.has(candidate.id))
    .map((candidate) => {
      const candidateNativeNorm = normalizeLanguage(candidate.native_language);
      const sharedTargets = candidate.targets.filter((target) =>
        userTargetIdSet.has(target.language_id),
      );
      const hasSharedTarget = sharedTargets.length > 0;

      const candidateLearnsUserNative = userNativeNorm
        ? candidate.targets.some((target) => normalizeLanguage(target.name) === userNativeNorm)
        : false;
      const userLearnsCandidateNative = candidateNativeNorm
        ? userTargetNameSet.has(candidateNativeNorm)
        : false;
      const isMutualExchange = hasRankingContext && candidateLearnsUserNative && userLearnsCandidateNative;

      let levelDelta = Number.NEGATIVE_INFINITY;
      for (const target of sharedTargets) {
        const myTarget = userTargets.get(target.language_id);
        if (!myTarget) continue;
        const delta = rankLevel(target.level) - rankLevel(myTarget.level);
        if (delta > levelDelta) levelDelta = delta;
      }

      const tier = !hasRankingContext ? 2 : isMutualExchange ? 0 : hasSharedTarget ? 1 : 2;

      const sortedTargets = [...candidate.targets].sort((a, b) => {
        const sharedA = userTargetIdSet.has(a.language_id) ? 1 : 0;
        const sharedB = userTargetIdSet.has(b.language_id) ? 1 : 0;
        if (sharedA !== sharedB) return sharedB - sharedA;
        return rankLevel(b.level) - rankLevel(a.level);
      });

      const displayTarget = sortedTargets[0] ?? {
        language_id: -1,
        name: "None",
        level: "beginner",
      };

      return {
        id: candidate.id,
        first_name: candidate.first_name,
        target_language: displayTarget.name,
        level: toDisplayLevel(displayTarget.level),
        tier,
        levelDelta,
        updated_at: candidate.updated_at,
      };
    });

  scored.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier;
    if (a.levelDelta !== b.levelDelta) return b.levelDelta - a.levelDelta;

    const aUpdated = Date.parse(a.updated_at ?? "");
    const bUpdated = Date.parse(b.updated_at ?? "");
    if (aUpdated !== bUpdated) return bUpdated - aUpdated;

    const aName = (a.first_name ?? "").toLowerCase();
    const bName = (b.first_name ?? "").toLowerCase();
    if (aName !== bName) return aName.localeCompare(bName);

    return a.id.localeCompare(b.id);
  });

  const partners = scored.map(({ tier: _tier, levelDelta: _levelDelta, updated_at: _updatedAt, ...rest }) => rest);
  const response = isRecommended ? partners.slice(0, 5) : partners;
  return NextResponse.json(response);
}