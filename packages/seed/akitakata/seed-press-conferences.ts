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
    slug: "2026-03-23",
    title: "令和8年3月 市長定例記者会見",
    heldAt: "2026-03-23",
    youtubeUrl: "https://www.youtube.com/watch?v=dBEPYtqF1jY",
    status: "published",
    items: [
      {
        itemType: "announcement",
        orderIndex: 0,
        title: "第3次安芸高田市総合計画の策定",
        summary:
          "市の最上位計画となる第3次総合計画を策定。基本構想の計画期間をこれまでの10年から20年に延長し、長期視点での政策整理を実施。基本計画は4年ごとに見直し（市長任期と連動）。幸福度・地域への愛着などの主観指標も新たに導入。市ホームページで閲覧可能。",
        turns: [],
      },
      {
        itemType: "announcement",
        orderIndex: 1,
        title: "お太助ワゴンにWeb予約を導入",
        summary:
          "デマンド交通「お太助ワゴン」にWeb予約システムを導入。従来の電話予約に加え24時間いつでもオンライン予約が可能となる。3月26日からWeb利用登録を開始し、4月13日から予約受付、4月15日から運行開始。既存の電話予約・紙登録も継続。",
        turns: [],
      },
      {
        itemType: "announcement",
        orderIndex: 2,
        title: "重点支援地方交付金 現金給付事業（住民1人1万円）",
        summary:
          "国の物価高等対応重点支援地方創生臨時交付金を活用し、住民1人あたり1万円を給付。4月14日（火）から郵便局窓口での受け取り開始。受け取り期間は6月30日まで。対象は2025年12月1日時点の住民登録者（約2万5430人）。コールセンターは4月1日から開設。",
        turns: [],
      },
      {
        itemType: "announcement",
        orderIndex: 3,
        title: "副業型地域活性化起業人の募集",
        summary:
          "総務省の副業型地域活性化起業人制度を活用し、動画・SNS運用の専門人材を受け入れる。YouTube・Instagramを活用した情報発信強化が目的。4月1日から募集開始（受付は4月22日まで）、6月上旬に契約締結予定。3大都市圏の企業に勤務する専門知識を持つ方が対象。",
        turns: [],
      },
      {
        itemType: "announcement",
        orderIndex: 4,
        title: "事業所省エネ設備導入支援事業（第2次募集）",
        summary:
          "市内の中小企業を対象に、省エネ設備の交換・新設に最大50万円（対象経費の3/4以内）を支援。昨年度実施の第2次募集。申請受付は5月11日（月）から7月31日まで（予算上限に達し次第終了）。支援対象期間は4月1日〜11月30日。",
        turns: [],
      },
      {
        itemType: "announcement",
        orderIndex: 5,
        title: "ひろしま神楽春夏秋冬特別公演 in 神楽ドーム",
        summary:
          "広島県内の神楽継承団体による特別公演を神楽ドームで開催。安芸高田市2団体・北広島町2団体・広島市1団体・廿日市市1団体の計6団体が出演し、各地に伝わる特色ある神楽を披露。令和2年度から継続している取り組み。",
        turns: [],
      },
      {
        itemType: "announcement",
        orderIndex: 6,
        title: "夜叉ぎょうざ（鹿肉餃子）を新発売",
        summary:
          "昨年末の学生アイデアソンで提案された「鹿肉餃子」を地域4事業者の合同プロジェクトで商品化。安芸高田市産の鹿肉と地元味噌を使用した冷凍餃子（20個入り・税込1,080円）を3月28日（土）から神楽門前湯治村で販売開始。発売記念イベントとして3月28〜31日に広島駅でも販売・飲食提供を実施。",
        turns: [],
      },
      {
        itemType: "announcement",
        orderIndex: 7,
        title: "【ふるさと納税返礼品紹介】岡田ハッピーファーム「しあわせ漬け」",
        summary:
          "今月のふるさと納税返礼品として、岡田ハッピーファームの「しあわせ漬け」を紹介。夫婦2人で始めた玄米専業農家が、収穫した玄米を使って開発したオリジナルの漬物。シャキシャキとした食感が特徴でご飯との相性抜群。「お客様の日々が少しでもハッピーになるように」という思いを込めた一品。",
        turns: [],
      },
      {
        itemType: "qa",
        orderIndex: 8,
        title: "重点支援地方交付金の発送時期・対象者数について",
        summary: null,
        turns: [
          {
            speaker: "reporter",
            speakerName: "中国新聞",
            content:
              "決定通知兼申請書はいつ頃発送されるのか。また対象者は何人か。",
            orderIndex: 0,
          },
          {
            speaker: "mayor",
            speakerName: null,
            content:
              "具体的な日付は決まっていないが、今月中に発送する準備を進めている。対象者は2025年12月1日時点で2万5430人。ただし単独世帯で亡くなられた方や国外転出者を除くため、実際の人数はそれより少なくなる見込み。",
            orderIndex: 1,
          },
        ],
      },
      {
        itemType: "qa",
        orderIndex: 9,
        title: "甲立駅への券売機設置について",
        summary: null,
        turns: [
          {
            speaker: "reporter",
            speakerName: "中国新聞",
            content:
              "先の定例会で甲立駅に券売機を設置するという答弁があったが、経緯といつ設置されるのか教えてほしい。",
            orderIndex: 0,
          },
          {
            speaker: "mayor",
            speakerName: null,
            content:
              "甲立駅で有人販売を委託していたが、委託先から予定より早く終了したいという連絡があった。地元からの存続要望もある中で、2月下旬にJR西日本の社長を訪問し、市として存続が難しい状況と経緯を説明した上で券売機の設置をお願いした。社長にも状況をご理解いただき、後日「新年度になるが券売機設置の方向で社内協議を進める」と連絡をいただいた。市の負担は場所の提供と電気代のみで、その他コストはJR側が負担。今年度早々に設置されると見込んでいる。",
            orderIndex: 1,
          },
        ],
      },
    ],
  },
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
