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

type ResourceLinkInput = {
  label: string;
  url: string;
};

type ItemInput = {
  itemType: "announcement" | "qa";
  orderIndex: number;
  title: string;
  summary: string | null;
  resourceUrls?: ResourceLinkInput[];
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
  {
    slug: "2026-08-24",
    title: "令和8年8月 市長定例記者会見",
    heldAt: "2026-08-24",
    youtubeUrl: "https://www.youtube.com/watch?v=bdm_HliFnl4",
    status: "published",
    items: [
      {
        itemType: "announcement",
        orderIndex: 0,
        title: "萩市「大照院」法要への参加（冒頭報告）",
        summary:
          "8月13日に山口県萩市の大照院で行われた法要に参加。大照院は毛利家の菩提寺であり、毛利家歴代藩主の霊が祀られ、厳かな雰囲気の中で参列。安芸高田市と萩市は毛利氏を通じた歴史的なつながりがあり、今回の法要参加をきっかけに今後も交流を深めていきたいと考えている。",
        turns: [],
      },
      {
        itemType: "announcement",
        orderIndex: 1,
        title: "NANJOキズナのわ元就の里リレーマラソン2026 ゲスト出演決定（冒頭報告）",
        summary:
          "10月10日（土）にスターライトビクトリアスポーツパークで開催するNANJOキズナのわ元就の里リレーマラソン2026のスターゲストとして、現在大河ドラマ「豊臣兄弟！」に出演中の俳優・濱田翔吾さんの参加が正式決定。参加募集は9月13日（日）まで。",
        turns: [],
      },
      {
        itemType: "announcement",
        orderIndex: 2,
        title: "芸備線改良への公費投入報道についての見解（冒頭報告）",
        summary:
          "中国新聞が報道した「芸備線改良に公費投入」について、現時点では具体的に決定した事実ではない。しかし芸備線は地域の生活・経済を支える重要な資産であり、三次方・広島まちづくり交通協議会において活性化に向けた議論を進めてきた。今後も国・県・沿線自治体・JRと連携し、公共交通ネットワークの利便性向上と持続可能性確保の取り組みについてどのような支援・役割が可能か検討を続ける。",
        turns: [],
      },
      {
        itemType: "announcement",
        orderIndex: 3,
        title: "TOYOTA GAZOO Racing ラリーチャレンジ2026 in安芸高田 盛況報告（冒頭報告）",
        summary:
          "昨日（8月23日）、高宮町のTS高田サーキットで開催し、事務局発表で5,000人が来場。4年ぶりの開催として市内外・県外から多数の来場者があった。関係人口を増やす取り組みの一つとして来年・再来年も継続していきたい方針。当日プレオープンしたスポーツミュージアムにはロードスター初代車両が展示され、ミュージアムを目当てに来場した方もいた。",
        turns: [],
      },
      {
        itemType: "announcement",
        orderIndex: 4,
        title: "安芸高田市「ゼロカーボンシティ」宣言",
        summary:
          "2050年までに二酸化炭素排出量の実質ゼロを目指す「安芸高田市ゼロカーボンシティ」をここに宣言。市民・事業者・行政が一体となって脱炭素に向けた取り組みを推進する。2013年度基準（55万t-CO₂）から2035年度までに21.8万t（60%削減）、2050年に実質ゼロを目標に設定。今年度、環境基本計画改定・地球温暖化対策実行計画（事務事業編）策定にあわせて具体的な取り組みを検討・反映させる。",
        resourceUrls: [
          {
            label: "資料",
            url: "https://www.akitakata.jp/akitakata-media/filer_public/43/8a/438a7b74-82e9-44a6-801e-dcd82c5443b6/shiryou-1_aki-takadashi-zeroka-bonshitei-sengen.pdf",
          },
          {
            label: "宣言書",
            url: "https://www.akitakata.jp/akitakata-media/filer_public/fd/de/fdde68ff-f2bf-467d-869a-fa492997d677/shiryou-1-2_aki-takadashi-zeroka-bonshitei-sengen-kaki.pdf",
          },
        ],
        turns: [],
      },
      {
        itemType: "announcement",
        orderIndex: 5,
        title: "環境価値（Jクレジット）の活用に関する連携協定の締結",
        summary:
          "アイリス大山株式会社・株式会社バイウィルと安芸高田市の3者で、ゼロカーボンシティ実現に向けたJクレジット活用に関する連携協定を締結。アイリス大山が設置するLED照明設備の省エネ効果をJクレジット化・販売支援するほか、森林管理・空調設備更新等によるJクレジット創出ポテンシャル調査も実施。締結式は9月4日（金）15時〜、安芸高田市役所2階。",
        resourceUrls: [
          {
            label: "資料",
            url: "https://www.akitakata.jp/akitakata-media/filer_public/7c/a9/7ca9e089-9ac8-49f7-bfd2-ad35b0076ce4/shiryou-2_kankyou-kachi-no-katsuyou-ni-kansu-ru-renkei-kyoutei-no-teiketsu.pdf",
          },
        ],
        turns: [],
      },
      {
        itemType: "announcement",
        orderIndex: 6,
        title: "ネーミングライツパートナーの募集",
        summary:
          "市が所有する4施設のネーミングライツパートナーを募集。①安芸高田市サッカー公園（サンフレッチェ広島の練習拠点）：年額300万円以上・期間2027年4月〜2030年3月・公募期間9月1日〜11月30日。②緑生涯学習センター 学び・③甲田文化センター ミューズ・④向原生涯学習センター 未来の3施設：年額100万円以上・期間2027年4月〜2032年3月・公募期間9月1日〜11月27日。詳細は9月1日に市ホームページで公開。",
        resourceUrls: [
          {
            label: "資料",
            url: "https://www.akitakata.jp/akitakata-media/filer_public/0f/7b/0f7b132c-38f3-42f7-9247-1d881eecb2b3/shiryou-3_ne-minguraitsupa-tona-no-boshuu.pdf",
          },
        ],
        turns: [],
      },
      {
        itemType: "announcement",
        orderIndex: 7,
        title: "第7回安芸高田こども神楽発表大会",
        summary:
          "市内各地域で活動する子ども神楽11団体が出演する第7回安芸高田こども神楽発表大会を9月21日（日・祝）に開催。チラシのイラストは安芸高田市立緑小学校の児童が作成。入場料は大人500円・高校生以下無料（当日券のみ・全席自由）。",
        resourceUrls: [
          {
            label: "資料",
            url: "https://www.akitakata.jp/akitakata-media/filer_public/a8/83/a8836845-486e-413f-9c15-0ffa65c4c45d/shiryou-4_dai-7kai-aki-takada-kodomo-kagura-happyou-taikai.pdf",
          },
          {
            label: "チラシ",
            url: "https://www.akitakata.jp/akitakata-media/filer_public/d8/11/d8111046-e635-4456-aadf-8cce788ebb21/shiryou-4-2_dai-7kai-aki-takada-kodomo-kagura-happyou-taikai-_chirashi.pdf",
          },
        ],
        turns: [],
      },
      {
        itemType: "announcement",
        orderIndex: 8,
        title: "第9回佐賀県伝承芸能祭に天神神楽団が出演",
        summary:
          "佐賀県各地に受け継がれている伝統芸能が一堂に会する第9回佐賀県伝承芸能祭（9月6日・日、佐賀市文化会館大ホール、入場無料）に天神神楽団が特別出演。第1回から連続して安芸高田市の神楽団が特別出演しており、九州圏での広島・安芸高田神楽の認知度向上につながる取り組み。",
        resourceUrls: [
          {
            label: "資料",
            url: "https://www.akitakata.jp/akitakata-media/filer_public/2f/29/2f29b828-36ad-4429-a901-dde60f98c3e2/shiryou-5_dai-9kai-sagaken-denshou-geinou-matsuri-ni-tenjin-kagura-dan-ga-shutsuen.pdf",
          },
          {
            label: "チラシ",
            url: "https://www.akitakata.jp/akitakata-media/filer_public/10/c3/10c301d9-5bae-432a-8e6d-3b9ed9ccebc2/shiryou-5-2_dai-9kai-sagaken-denshou-geinou-matsuri-_chirashi.pdf",
          },
        ],
        turns: [],
      },
      {
        itemType: "announcement",
        orderIndex: 9,
        title: "ふるさと納税返礼品紹介：gallery えんがわ（アイハーブソルト）",
        summary:
          "今月の返礼品紹介は向原町のギャラリーえんがわ。作品展示とカフェを組み合わせた地域の交流拠点で、手作り作家のバッグ・アクセサリー・工芸作品も取り扱う。返礼品は向原町産の「アイ（藍）」と天然ハーブ・海塩をブレンドした手作り「アイハーブソルト」。古来から薬草としても親しまれ、ポリフェノールを含む藍を活用した商品。おにぎり・卵焼き・塩焼きなど様々な料理に使える上品な仕上がり。",
        resourceUrls: [
          {
            label: "資料",
            url: "https://www.akitakata.jp/akitakata-media/filer_public/31/33/3133d7e4-79cb-46b2-bb8a-bc06abea5e54/shiryou-6_furusato-nouzei-no-henrei-hin-shoukai-_gallery_engawa.pdf",
          },
        ],
        turns: [],
      },
      {
        itemType: "qa",
        orderIndex: 10,
        title: "Jクレジット活用・連携協定について",
        summary: null,
        turns: [
          {
            speaker: "reporter",
            speakerName: "読売新聞",
            content:
              "Jクレジットについてもう少し説明していただけますか？活用のイメージと、創出ポテンシャル調査で何が可能になるかを教えてください。",
            orderIndex: 0,
          },
          {
            speaker: "mayor",
            speakerName: null,
            content:
              "今進めているLED化によって傾向灯からLEDに更新されることで二酸化炭素が削減され、その削減量がJクレジットとして創出されます。このJクレジットを他の環境政策の財源として活用することを考えています。",
            orderIndex: 1,
          },
          {
            speaker: "reporter",
            speakerName: "読売新聞",
            content: "ポテンシャル調査とはどのようなものですか？",
            orderIndex: 2,
          },
          {
            speaker: "mayor",
            speakerName: null,
            content:
              "今回の協定はLEDに特化していますが、例えば森林管理、ボイラーや空調設備の更新などによってもJクレジットが創出される可能性があります。こうした創出ポテンシャルについて調査を行っていただく内容になります。",
            orderIndex: 3,
          },
          {
            speaker: "reporter",
            speakerName: "読売新聞",
            content: "Jクレジットが創出されることで安芸高田市にどのようなメリットがあるのでしょうか？",
            orderIndex: 4,
          },
          {
            speaker: "mayor",
            speakerName: null,
            content:
              "Jクレジット自体が収入になり、そのお金を他の環境政策に回して実行していくことができます。",
            orderIndex: 5,
          },
        ],
      },
      {
        itemType: "qa",
        orderIndex: 11,
        title: "ネーミングライツの金額設定の根拠について",
        summary: null,
        turns: [
          {
            speaker: "reporter",
            speakerName: "中国新聞",
            content:
              "サッカー公園と文化センター3施設で希望金額に差がありますが、その設定根拠を教えてください。",
            orderIndex: 0,
          },
          {
            speaker: "mayor",
            speakerName: null,
            content:
              "サッカー公園については、オープンから年数が経過し施設修繕費が年々増加しています。近年の小規模修繕だけでもかなりの費用がかかっており、それに加えてサンフレッチェのSNSや各メディアへの露出効果を総合的に勘案して金額を設定しました。文化センター3施設については、前回クリスタルジオのネーミングライツを実施した際の金額帯に合わせた形にしています。",
            orderIndex: 1,
          },
        ],
      },
      {
        itemType: "qa",
        orderIndex: 12,
        title: "向原高校の募集停止正式決定について",
        summary: null,
        turns: [
          {
            speaker: "reporter",
            speakerName: "広島テレビ",
            content:
              "2029年度から向原高校の生徒募集を停止することが正式決定されましたが、市長としての受け止めをお聞かせください。",
            orderIndex: 0,
          },
          {
            speaker: "mayor",
            speakerName: null,
            content:
              "安芸高田市には2つの県立高等学校があります。その1つである向原高校が募集停止になるということは、素直に残念・寂しい思いがしております。同窓会の皆さんや活生会委員会の皆様が公営塾・民間塾・下宿など様々な取り組みをされましたが、入学者の増加にはなかなかつながりませんでした。厳しい現実の上にこの決定がなされたと思います。",
            orderIndex: 1,
          },
          {
            speaker: "reporter",
            speakerName: "広島テレビ",
            content:
              "地域から若者が消えることへの今後の対策や考えはありますか？",
            orderIndex: 2,
          },
          {
            speaker: "mayor",
            speakerName: null,
            content:
              "もう1校残る吉田高校が受け皿になるようにしっかりと向原高校の伝統も受け継ぎながら、サンフレッチェのユース・今後はジュニアユースも入ってきますので、中学校・高校の連携も含めて新たな魅力を今から考えていきたいと思います。",
            orderIndex: 3,
          },
        ],
      },
      {
        itemType: "qa",
        orderIndex: 13,
        title: "防災訓練・防災の日の取り組みについて",
        summary: null,
        turns: [
          {
            speaker: "reporter",
            speakerName: "読売新聞",
            content:
              "近年、水害や地震など自然災害が増えています。9月1日の防災の日に向けた訓練やイベントの予定はありますか？",
            orderIndex: 0,
          },
          {
            speaker: "mayor",
            speakerName: null,
            content:
              "9月1日は例年通りの取り組みを行います。それ以外に市民対象の防災フェアのような体験会も開催したいと今計画中です。",
            orderIndex: 1,
          },
        ],
      },
      {
        itemType: "qa",
        orderIndex: 14,
        title: "熊対策・緊急猟の法改正への対応について",
        summary: null,
        turns: [
          {
            speaker: "reporter",
            speakerName: "NHK",
            content:
              "熊の緊急猟に関する法改正に伴い各自治体で運用ルールが課題となっています。安芸高田市として熊の緊急猟の現場での運用やルール化に向けてどのような取り組みをされていますか？",
            orderIndex: 0,
          },
          {
            speaker: "mayor",
            speakerName: null,
            content:
              "先般、緊急猟のマニュアルを制定しました。それに基づいて運用していきたいと思います。子どもたちへの安全対策については引き続き熊鈴の配布や学校での啓発、猟友会との連携などに力を入れていきます。猟友会・警察との連携は日々取っており、マニュアルができたことによって円滑に動けるようにしていきたいと思います。",
            orderIndex: 1,
          },
          {
            speaker: "reporter",
            speakerName: "NHK",
            content:
              "マニュアルの実行性を日頃から高めるための訓練確認など、取り組まれていることはありますか？",
            orderIndex: 2,
          },
          {
            speaker: "mayor",
            speakerName: null,
            content:
              "まだマニュアルを制定したばかりで具体的な訓練には至っていませんが、有事の際に迷わず対応できるよう、担当部の方で猟友会との関係をしっかり維持してもらっています。警察との連携も日々取っており、マニュアルができたことで円滑に動けるよう、今後もこれらが起こらないことに向けた対策にもしっかりと力を入れていきたいと思います。",
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
          resource_urls: item.resourceUrls ?? [],
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
