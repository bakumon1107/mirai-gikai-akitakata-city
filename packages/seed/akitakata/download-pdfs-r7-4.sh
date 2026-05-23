#!/bin/bash
# 令和7年第4回定例会 議案PDF一括ダウンロード
set -e

DIR="/tmp/akitakata-pdfs-r74"
mkdir -p "$DIR"

echo "📥 PDFダウンロード開始 → $DIR"

download() {
  local key="$1"
  local url="$2"
  local dest="$DIR/gian${key}.pdf"
  if [ -f "$dest" ]; then
    echo "  ⏭️  gian${key}.pdf (既存スキップ)"
  else
    echo "  ⬇️  gian${key}.pdf ..."
    curl -sL "$url" -o "$dest"
  fi
}

download "64" "https://www.akitakata.jp/akitakata-media/filer_public/3f/e7/3fe7a140-4b4a-4247-bc9f-af53b43dbbab/gian-dai-64gou-aki-takadashi-jimu-bunshou-jourei-no-ichibu-wo-kaisei-suru-jourei.pdf"
download "65" "https://www.akitakata.jp/akitakata-media/filer_public/a9/ff/a9ff9e7e-6c0b-48fd-882f-e72e78d8f8a2/gian-dai-65gou-aki-takadashi-shokuin-no-kyuuyo-ni-kansu-ru-jourei-oyobi-aki-takadashi-ippanshoku-no-ninki-tsuki-shokuin-no-saiyou-nado-ni-kansu-ru-jourei-no-ichibu-wo-kaisei-suru-jourei.pdf"
download "66" "https://www.akitakata.jp/akitakata-media/filer_public/0a/b3/0ab3711d-bfd1-415d-bd13-2de7aafa5e22/gian-dai-66gou-aki-takadashi-tokubetsushoku-no-shokuin-de-joukin-nomonono-kyuuyo-oyobi-ryohi-ni-kansu-ru-jourei-no-ichibu-wo-kaisei-suru-jourei.pdf"
download "67" "https://www.akitakata.jp/akitakata-media/filer_public/58/be/58be4425-1615-468c-87f5-3f7c78703450/gian-dai-67gou-aki-takadashi-zaisan-ku-kanri-kai-jourei-no-ichibu-wo-kaisei-suru-jourei-_.pdf"
download "68" "https://www.akitakata.jp/akitakata-media/filer_public/32/d7/32d736de-311f-4ca1-9132-764f154953cd/gian-dai-68gou-aki-takadashi-zaisan-ku-kanriiin-no-houshuu-oyobi-hiyou-benshou-nado-ni-kansu-ru-jourei-no-ichibu-wo-kaisei-suru-jourei-_.pdf"
download "69" "https://www.akitakata.jp/akitakata-media/filer_public/d8/01/d801bf35-da74-496f-97f2-6d0c4b248cb4/gian-dai-69gou-aki-takadashi-saka-zaisan-ku-kikin-jourei-_.pdf"
download "70" "https://www.akitakata.jp/akitakata-media/filer_public/d1/4d/d14dab3a-0662-405b-a134-ee23d1b0691c/gian-dai-70gou-_aki-takadashi-kou-no-shisetsu-no-shitei-kanrisha-no-shitei-nitsuite.pdf"
download "71" "https://www.akitakata.jp/akitakata-media/filer_public/e9/00/e9002e9d-a497-4e4f-83ac-60f379239473/gian-dai-71gou-_zaisan-no-mushou-jouto-nitsuite.pdf"
download "72" "https://www.akitakata.jp/akitakata-media/filer_public/cf/4e/cf4e2eb1-399e-4609-8eea-cecabe8db6de/gian-dai-72gou-aki-takadashi-tokutei-nyuuji-nado-tsuuen-shien-jigyou-no-unei-ni-kansu-ru-kijun-wo-sadame-ru-jourei.pdf"
download "73" "https://www.akitakata.jp/akitakata-media/filer_public/b6/93/b693b250-4611-41cd-9907-45c211495037/gian-dai-73gou-aki-takadashi-nyuuji-nado-tsuuen-shien-jigyou-no-setsubi-oyobi-unei-ni-kansu-ru-kijun-wo-sadame-ru-jourei-no-ichibu-wo-kaisei-suru-jourei.pdf"
download "74" "https://www.akitakata.jp/akitakata-media/filer_public/d4/e0/d4e074c4-80e3-481b-8959-b9dc2096867f/gian-dai-74gou-aki-takadashi-hi-ire-ni-kansu-ru-jourei-no-ichibu-wo-kaisei-suru-jourei-_.pdf"
download "75" "https://www.akitakata.jp/akitakata-media/filer_public/26/2c/262cc916-b888-4c8b-a962-1ac5311accab/gian-dai-75gou-aki-takadashi-gesuidou-jigyou-juekishafutan-kin-oyobi-buntankin-choushuu-jourei-no-ichibu-wo-kaisei-suru-jourei.pdf"
download "76" "https://www.akitakata.jp/akitakata-media/filer_public/ba/ef/baefd6dd-c293-4d2b-adb7-2861b848192e/gian-dai-76gou-aki-takadashi-kasaiyobou-jourei-no-ichibu-wo-kaisei-suru-jourei.pdf"
download "77" "https://www.akitakata.jp/akitakata-media/filer_public/81/7d/817d080c-e19e-4fb1-aba4-d2227babeca2/gian-dai-77gourei-wa-7nendo-aki-takadashi-ippankaikei-hoseiyosan-dai-6gou.pdf"
download "78" "https://www.akitakata.jp/akitakata-media/filer_public/ce/51/ce51e533-7231-4f1f-9373-4c517c66b41c/gian-dai-78gourei-wa-7nendo-aki-takadashi-kokuminkenkouhoken-tokubetsukaikei-hoseiyosan-dai-3gou.pdf"
download "79" "https://www.akitakata.jp/akitakata-media/filer_public/27/2c/272c62cc-efaf-4ce0-abbb-0824231e2c92/gian-dai-79gourei-wa-7nendo-aki-takadashi-kouki-koureisha-iryou-tokubetsukaikei-hoseiyosan-dai-1gou.pdf"
download "80" "https://www.akitakata.jp/akitakata-media/filer_public/44/70/44706db1-b5a1-4496-9824-e73c8d2c3f95/gian-dai-80gourei-wa-7nendo-aki-takadashi-kaigo-hoken-tokubetsukaikei-hoseiyosan-dai-2gou.pdf"
download "81" "https://www.akitakata.jp/akitakata-media/filer_public/45/0e/450ebb9c-6f3c-4786-ac55-7e4476e0d87d/gian-dai-81gourei-wa-7nendo-aki-takadashi-komyuniteipuranto-tokubetsukaikei-hoseiyosan-dai-1gou.pdf"
download "82" "https://www.akitakata.jp/akitakata-media/filer_public/f7/95/f795a7f8-3b48-47ab-8a4a-17d93cace46b/gian-dai-82gourei-wa-7nendo-aki-takadashi-gesuidou-jigyoukai-kei-hoseiyosan-dai-2gou.pdf"
download "83" "https://www.akitakata.jp/akitakata-media/filer_public/ee/77/ee77560a-def3-400b-b4de-43151363d0d5/gian-dai-83gourei-wa-7nendo-aki-takadashi-ippankaikei-hoseiyosan-dai-7gou.pdf"
download "h5" "https://www.akitakata.jp/akitakata-media/filer_public/95/ea/95ea5719-0fc8-414d-bc4f-e5456b27bb51/gian-dai-5gou-_aki-takadashi-gikai-no-giin-no-houshuu-oyobi-hiyou-benshou-nado-ni-kansu-ru-jourei-no-ichibu-wo-kaisei-suru-jourei-_merged.pdf"

echo ""
echo "✅ 完了: $(ls $DIR/*.pdf | wc -l)件"
ls -lh "$DIR"/*.pdf
