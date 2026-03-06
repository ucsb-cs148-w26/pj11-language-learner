import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/lib/supabaseServer'
import { createFriendService } from "@/utils/friends/friendService";

import { 
  DiscoverRow, 
  Candidate, 
  CandidateTarget, 
} from "@/app/discover/types";

const LEVEL_RANK: Record<string, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
};

function toDisplayLevel(level: string | null | undefined): string {
  if (!level) return "Beginner";
  return level.charAt(0).toUpperCase() + level.slice(1);
}

function rankLevel(level: string | null | undefined): number {
  return LEVEL_RANK[(level ?? "").toLowerCase()] ?? 0;
}

function normalizeLanguage(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user || authError) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const languageFilter = searchParams.get("language");
  const levelFilter = searchParams.get("level");
  const isRecommended = searchParams.get("recommended") === "true";
  const rawPage = Number.parseInt(searchParams.get("page") ?? "1", 10);
  const rawPageSize = Number.parseInt(searchParams.get("pageSize") ?? "10", 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const pageSize = Number.isFinite(rawPageSize) && rawPageSize > 0 ? Math.min(rawPageSize, 50) : 10;

  const [
    { data: userProfile }, 
    { data: userTargetRows },
    { data: existingConversations }
  ] = await Promise.all([
    supabase.from("profiles").select("native_language").eq("user_id", user.id).maybeSingle(),
    supabase.from("profile_target_languages").select("language_id, level, lang:languages!inner(name)").eq("user_id", user.id),
    supabase.from("conversation_participants").select("conversation_id").eq("user_id", user.id)
  ]);

  const userNative = userProfile?.native_language ?? "";
  const userNativeNormalized = normalizeLanguage(userNative);
  const userTargets = new Map(userTargetRows?.map(r => [r.language_id, { name: (r.lang as any).name, level: r.level }]) ?? []);
  const userTargetNameSet = new Set(
    (userTargetRows ?? [])
      .map((r) => normalizeLanguage((r.lang as any).name))
      .filter(Boolean)
  );
  const userLanguageSet = new Set([userNativeNormalized, ...userTargetNameSet].filter(Boolean));
  const userTargetIdSet = new Set(userTargets.keys());

  const friends = createFriendService(supabase);
  const edges = await friends.getFriendsList({ userId: user!.id });
  const { incoming, outgoing } = await friends.getFriendRequestsList({ userId: user!.id, status: "pending" });
  
  // build exlusion list from current user and user's friends 
  const excludeList = Array.from(new Set([
    user.id, 
    ...edges.map(e => e.friend_user_id)
  ])).filter(Boolean);

  // get status helper searching a user's incoming and outgoing requests
  const getStatus = (targetId: string) => {
    const incomingReq = incoming.find(r => r.requester_id === targetId);
    const outgoingReq = outgoing.find(r => r.recipient_id === targetId);
    if (incomingReq) {
      return { status: "pending_received" as const, requestId: incomingReq.id };
    }
    if (outgoingReq) {
      return { status: "pending_sent" as const, requestId: outgoingReq.id };
    }
    return { status: "none" as const, requestId: null };
  };

  let query = supabase
    .from("profile_target_languages")
    .select(`
      user_id,
      language_id,
      level,
      profiles!inner(first_name, native_language, updated_at),
      lang:languages!inner(name)
    `)
    .not('user_id', 'in', `(${excludeList.map(id => `"${id}"`).join(',')})`);

  if (levelFilter && levelFilter !== "All") {
    query = query.ilike('level', levelFilter);
  }

  if (languageFilter && languageFilter.trim() !== "") {
    query = query.ilike('lang.name', `%${languageFilter.trim()}%`);
  }

  const { data: profiles, error } = await query;

  if (error) {
    console.error("Supabase Query Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const grouped = new Map<string, Candidate>();
  for (const row of (profiles as DiscoverRow[]) ?? []) {
    const existing = grouped.get(row.user_id);
    const lang = firstRelation(row.lang);
    const profile = firstRelation(row.profiles);
    const nextTarget: CandidateTarget = {
      language_id: row.language_id,
      name: lang?.name ?? "None",
      level: (row.level ?? "beginner").toLowerCase(),
    };

    let request_data = getStatus(row.user_id);
    if (!existing) {
      grouped.set(row.user_id, {
        id: row.user_id,
        first_name: profile?.first_name ?? null,
        native_language: profile?.native_language ?? null,
        updated_at: profile?.updated_at ?? null,
        targets: [nextTarget],
        friendship: {
          status: request_data.status,
          request_id: request_data.requestId,
        }
      });
      continue;
    }

    existing.targets.push(nextTarget);
  }

  const candidateIds = [...grouped.keys()];
  if (candidateIds.length > 0) {
    const { data: allTargetRows, error: allTargetRowsError } = await supabase
      .from("profile_target_languages")
      .select("user_id, language_id, level, lang:languages!inner(name)")
      .in("user_id", candidateIds);

    if (allTargetRowsError) {
      return NextResponse.json({ error: allTargetRowsError.message }, { status: 500 });
    }

    const allTargetsByUserId = new Map<string, CandidateTarget[]>();
    for (const row of allTargetRows ?? []) {
      const lang = firstRelation((row as any).lang);
      const target: CandidateTarget = {
        language_id: (row as any).language_id,
        name: lang?.name ?? "None",
        level: ((row as any).level ?? "beginner").toLowerCase(),
      };
      const existingTargets = allTargetsByUserId.get((row as any).user_id);
      if (existingTargets) {
        existingTargets.push(target);
      } else {
        allTargetsByUserId.set((row as any).user_id, [target]);
      }
    }

    for (const candidate of grouped.values()) {
      const completeTargets = allTargetsByUserId.get(candidate.id);
      if (completeTargets && completeTargets.length > 0) {
        candidate.targets = completeTargets;
      }
    }
  }

  const scored = [...grouped.values()]
    .filter((candidate) => {
      const candidateLanguages = new Set<string>();
      const candidateNative = normalizeLanguage(candidate.native_language);
      if (candidateNative) candidateLanguages.add(candidateNative);
      for (const target of candidate.targets) {
        const normalizedTarget = normalizeLanguage(target.name);
        if (normalizedTarget) candidateLanguages.add(normalizedTarget);
      }

      for (const lang of candidateLanguages) {
        if (userLanguageSet.has(lang)) return true;
      }
      return false;
    })
    .map((candidate) => {
      const candidateNativeLanguage = candidate.native_language ?? "";
      const sharedTargets = candidate.targets.filter((target) =>
        userTargetIdSet.has(target.language_id),
      );
      const hasSharedTarget = sharedTargets.length > 0;

      const candidateLearnsUserNative = userNativeNormalized
        ? candidate.targets.some((target) => normalizeLanguage(target.name) === userNativeNormalized)
        : false;
      const userLearnsCandidateNative = candidateNativeLanguage
        ? userTargetNameSet.has(normalizeLanguage(candidateNativeLanguage))
        : false;
      const isMutualExchange = candidateLearnsUserNative && userLearnsCandidateNative;

      let levelDelta = 0;
      for (const target of sharedTargets) {
        const myTarget = userTargets.get(target.language_id);
        if (!myTarget) continue;
        const delta = rankLevel(target.level) - rankLevel(myTarget.level);
        if (delta > levelDelta) levelDelta = delta;
      }

      const tier = isMutualExchange ? 0 : hasSharedTarget ? 1 : 2;

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
        native_language: candidate.native_language,
        target_language: displayTarget.name,
        level: toDisplayLevel(displayTarget.level),
        target_languages: sortedTargets.map((target) => ({
          name: target.name,
          level: toDisplayLevel(target.level),
        })),
        tier,
        levelDelta,
        updated_at: candidate.updated_at,
        friendship: candidate.friendship,
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
  if (isRecommended) {
    return NextResponse.json(partners.slice(0, 5));
  }

  const total = partners.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const items = partners.slice(start, start + pageSize);

  return NextResponse.json({
    items,
    total,
    page: safePage,
    pageSize,
    totalPages,
  });
}