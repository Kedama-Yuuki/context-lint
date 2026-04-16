export default {
  rules: {
    // M1: 矛盾チェック
    "M1-001": {
      description: "同じトークン・変数名に異なる値が定義されていないこと",
      message: "「{{name}}」に値の矛盾があります: {{locations}}。",
    },
    "M1-002": {
      description: "肯定形と否定形で矛盾する制約がないこと",
      message: "矛盾の可能性: {{lineA}}行目 と {{lineB}}行目。",
    },
    "M1-003": {
      description: "参照先のファイルパスが実在すること",
      message: "{{line}}行目のファイルパスまたはコマンド「{{ref}}」が存在しない可能性があります。",
    },

    // M2: 重複チェック
    "M2-001": {
      description: "同じ内容が複数セクションに散在していないこと",
      message: "セクション「{{sectionB}}」が「{{sectionA}}」（{{line}}行目）と{{similarity}}%類似しています。統合を検討してください。",
    },
    "M2-002": {
      description: "同じ概念が複数の名前で呼ばれていないこと",
      message: "「{{nameB}}」は「{{nameA}}」と同じ概念の可能性があります。名前を統一してください。",
    },

    // M3: 明瞭性チェック
    "M3-001": {
      description: "曖昧語が使われていないこと",
      message: "{{line}}行目に曖昧語「{{word}}」が使用されています。具体的に記述してください。",
    },
    "M3-002": {
      description: "否定形による制約が多用されていないこと",
      message: "否定パターンが過度に使用されています（{{count}}箇所）。肯定的な指示を推奨します。",
    },
    "M3-003": {
      description: "値に単位・型が明示されていること（8ではなく8px）",
      message: "{{line}}行目の値「{{value}}」に単位または型がありません。",
    },

    // M4: Lost in the Middle チェック
    "M4-001": {
      description: "CRITICAL制約がファイル冒頭20%以内にあること",
      message: "重要制約「{{keyword}}」が{{line}}行目（上位20%より下）にあります。重要な制約はファイル冒頭に移動してください。",
    },
    "M4-002": {
      description: "ファイルのトークン数が推奨上限（8,000トークン）以内であること",
      message: "ファイルの推定トークン数が約{{count}}で、推奨上限の8,000を超えています。分割を検討してください。",
    },
    "M4-003": {
      description: "重要な参照が冒頭セクションに集約されていること",
      message: "{{count}}件のファイル参照が上位20%より下にありますが、冒頭セクションには参照がありません。冒頭に参照サマリーを追加してください。",
    },
  },

  scorer: {
    ranks: {
      "AI-Ready": "AI-Ready",
      "Mostly Ready": "Mostly Ready（軽微な修正推奨）",
      "Needs Work": "Needs Work（AIが補完に頼る箇所あり）",
      "Not AI-Ready": "Not AI-Ready（AI誤動作リスクあり）",
    },
  },

  reporter: {
    summary: "{{count}}件の問題が見つかりました",
    score: "スコア: {{score}}/100（{{rank}}）",
    noIssues: "問題はありません。ファイルはAI-Readyです！",
    filePath: "ファイル: {{path}}",
  },
} as const;
