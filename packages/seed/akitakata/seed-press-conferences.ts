/**
 * seed-press-conferences.ts
 *
 * 市長定例記者会見データをDBに投入する。
 * 既存データ（同一slug）はスキップする。
 *
 * 使い方:
 *   tsx --env-file=../../.env akitakata/seed-press-conferences.ts
 *
 * 注意:
 *   会見テキストはYouTube自動生成字幕から構造化。公式文字起こしではないため
 *   一部の固有名詞・数値に誤りが含まれる可能性がある。随時修正すること。
 */

import { createAdminClient } from "../shared/helper";

type TurnInput = {
  speaker: "mayor" | "reporter";
  speakerName: string | null;
  content: string;
  orderIndex: number;
};

type ItemInput = {
  itemType: "announcement" | "qa";
  orderIndex: number;
  title: string;
  summary: string | null;
  turns: TurnInput[];
};

type PressConferenceInput = {
  slug: string;
  title: string;
  heldAt: string;
  youtubeUrl: string | null;
  status: string;
  items: ItemInput[];
};

const DATA: PressConferenceInput[] = [
  {
    slug: "2026-04-28",
    title: "令和8年4月 市長定例記者会見",
    heldAt: "2026-04-28",
    youtubeUrl: "https://www.youtube.com/watch?v=Gj3VTE8UJUQ",
    status: "published",
    items: [
      {
        itemType: "announcement",
        orderIndex: 0,
        title: "学校の机・椅子をモンゴル国の学校へ寄贈",
        summary:
          "全児童の机・椅子を新式規格に更新した際の旧机・椅子を、国づくり人づくり財団を通じてモンゴル国の学校へ寄贈。現地の子どもたちの学習環境充実に活用される。この日の午後に新モンゴル日本学園の理事長が安芸高田市を表敬訪問。",
        turns: [],
      },
      {
        itemType: "announcement",
        orderIndex: 1,
        title: "市長との対話集会の開催について",
        summary:
          "市民センター・文化センターの組織について「これからの地域拠点の形」をテーマとした対話集会を開催。人口減少・高齢化が進む中、市民センターや文化センターのあり方を市民と意見交換しながら検討する。事前申し込み不要。",
        turns: [],
      },
      {
        itemType: "announcement",
        orderIndex: 2,
        title: "広島神楽関西公演（西宮）",
        summary:
          "5回目となる広島神楽関西公演を2026年7月4日（土）に兵庫県立芸術文化センター（兵庫県西宮市）で開催。安芸高田市・北広島・安芸太田町の3市町の神楽団が出演。前売りチケットは4月29日10時から一般販売開始。4市町の特産品販売・神楽衣装体験も実施。",
        turns: [],
      },
      {
        itemType: "announcement",
        orderIndex: 3,
        title: "安芸高田ハンドボールクラブ応援事業",
        summary:
          "リーグHで活躍する地元ハンドボールクラブのシーズン終盤の地元開催試合（5月3日・5月23日）を応援。安芸高田市在住または在勤の方は無料招待（協賛企業による）。バルーンスティックを配布。",
        turns: [],
      },
      {
        itemType: "qa",
        orderIndex: 4,
        title: "対話集会の開催時間帯を昼間にした理由",
        summary: null,
        turns: [
          {
            speaker: "reporter",
            speakerName: null,
            content:
              "これまで夜に開催していたと思いますが、今回は昼間の時間帯が多いようです。仕事をしている人は参加しにくい時間帯だと思いますが、なぜ昼間にしたのでしょうか？",
            orderIndex: 0,
          },
          {
            speaker: "mayor",
            speakerName: null,
            content:
              "夕飯時の時間帯だったり、暗くなってから出かけるのが出づらいというお声をいただいていましたので、今回は昼間の時間帯に切り替えてみました。ただ、1回分は夜の時間帯も設定していますので、昼間の参加が難しい方はそちらにご参加ください。",
            orderIndex: 1,
          },
          {
            speaker: "reporter",
            speakerName: null,
            content:
              "そういう声はどのくらいあったのでしょうか？",
            orderIndex: 2,
          },
          {
            speaker: "mayor",
            speakerName: null,
            content:
              "正式な数ではないのですが、日常的に市民の方からそういったお声を聞いているというところです。",
            orderIndex: 3,
          },
        ],
      },
      {
        itemType: "qa",
        orderIndex: 5,
        title: "広島神楽関西公演の過去実績と予算について",
        summary: null,
        turns: [
          {
            speaker: "reporter",
            speakerName: null,
            content:
              "5回目とのことですが、1回目から4回目はどこで開催されたのでしょうか？またチケットの売れ行きはいかがでしたか？",
            orderIndex: 0,
          },
          {
            speaker: "mayor",
            speakerName: null,
            content:
              "これまでは大阪のメルパルクホールや堺市のフェニーチェといった施設で開催しています。詳細な過去の開催場所や収容人数については手元にありませんので、後日共有します。チケットについては、完売の年もありますが、昨年は一部残ってしまいました。",
            orderIndex: 1,
          },
          {
            speaker: "reporter",
            speakerName: null,
            content:
              "予算は全体でいくらくらいで、3市町で分担されるのでしょうか？",
            orderIndex: 2,
          },
          {
            speaker: "mayor",
            speakerName: null,
            content:
              "参加される北広島町・安芸太田町にもご負担いただいており、各市町120万円の負担となっています。",
            orderIndex: 3,
          },
        ],
      },
    ],
  },
];

async function seedPressConferences() {
  const supabase = createAdminClient();
  console.log("🎤 市長記者会見データの投入を開始します...");

  for (const pc of DATA) {
    const { data: existing } = await supabase
      .from("press_conferences")
      .select("id")
      .eq("slug", pc.slug)
      .maybeSingle();

    if (existing) {
      console.log(`⏭️  スキップ（既存）: ${pc.slug}`);
      continue;
    }

    const { data: pcData, error: pcError } = await supabase
      .from("press_conferences")
      .insert({
        slug: pc.slug,
        title: pc.title,
        held_at: pc.heldAt,
        youtube_url: pc.youtubeUrl,
        status: pc.status,
      })
      .select("id")
      .single();

    if (pcError || !pcData) {
      console.error(`❌ 会見の挿入失敗: ${pc.slug}`, pcError);
      continue;
    }

    for (const item of pc.items) {
      const { data: itemData, error: itemError } = await supabase
        .from("press_conference_items")
        .insert({
          press_conference_id: pcData.id,
          item_type: item.itemType,
          order_index: item.orderIndex,
          title: item.title,
          summary: item.summary,
        })
        .select("id")
        .single();

      if (itemError || !itemData) {
        console.error(`❌ アイテムの挿入失敗: ${item.title}`, itemError);
        continue;
      }

      if (item.turns.length > 0) {
        const { error: turnsError } = await supabase
          .from("press_conference_turns")
          .insert(
            item.turns.map((turn) => ({
              press_conference_item_id: itemData.id,
              speaker: turn.speaker,
              speaker_name: turn.speakerName,
              content: turn.content,
              order_index: turn.orderIndex,
            }))
          );

        if (turnsError) {
          console.error(
            `❌ ターンの挿入失敗: ${item.title}`,
            turnsError
          );
        }
      }
    }

    console.log(`✅ 投入完了: ${pc.slug} (${pc.title})`);
  }

  console.log("🎉 完了しました");
}

seedPressConferences().catch(console.error);
