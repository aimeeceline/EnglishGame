import { VocabDeck } from "@/types/vocab";

export const DEFAULT_DECKS: VocabDeck[] = [
  {
    id: "deck_toeic_essentials",
    title: "TOEIC 500 Từ Vựng Cốt Lõi",
    description: "Các từ vựng thường xuất hiện nhất trong đề thi TOEIC phần Reading & Listening.",
    category: "TOEIC",
    cardCount: 6,
    isDefault: true,
    sourceType: "manual",
    createdAt: Date.now(),
    cards: [
      {
        id: "t_1",
        word: "Negotiate",
        phonetic: "/nəˈɡoʊ.ʃi.eɪt/",
        partOfSpeech: "verb",
        meaning: "Đàm phán, thương lượng",
        exampleSentence: "The union is negotiating for a higher salary.",
        exampleTranslation: "Công đoàn đang đàm phán để có mức lương cao hơn."
      },
      {
        id: "t_2",
        word: "Implement",
        phonetic: "/ˈɪm.plə.ment/",
        partOfSpeech: "verb",
        meaning: "Thi hành, thực hiện",
        exampleSentence: "The company will implement a new security policy next month.",
        exampleTranslation: "Công ty sẽ triển khai chính sách bảo mật mới vào tháng tới."
      },
      {
        id: "t_3",
        word: "Persistent",
        phonetic: "/pərˈsɪs.tənt/",
        partOfSpeech: "adjective",
        meaning: "Kiên trì, bền bỉ",
        exampleSentence: "Her persistent efforts finally paid off.",
        exampleTranslation: "Những nỗ lực bền bỉ của cô ấy cuối cùng đã được đền đáp."
      },
      {
        id: "t_4",
        word: "Substantial",
        phonetic: "/səbˈstæn.ʃəl/",
        partOfSpeech: "adjective",
        meaning: "Đáng kể, quan trọng",
        exampleSentence: "There has been a substantial increase in online sales.",
        exampleTranslation: "Đã có một sự gia tăng đáng kể trong doanh số bán hàng trực tuyến."
      },
      {
        id: "t_5",
        word: "Collaborate",
        phonetic: "/kəˈlæb.ə.reɪt/",
        partOfSpeech: "verb",
        meaning: "Hợp tác, cộng tác",
        exampleSentence: "Two researchers collaborated on the groundbreaking study.",
        exampleTranslation: "Hai nhà nghiên cứu đã hợp tác trong công trình đột phá này."
      },
      {
        id: "t_6",
        word: "Accommodate",
        phonetic: "/əˈkɑː.mə.deɪt/",
        partOfSpeech: "verb",
        meaning: "Đáp ứng, cung cấp chỗ ở",
        exampleSentence: "The hotel can accommodate up to 500 guests.",
        exampleTranslation: "Khách sạn có thể chứa tối đa 500 khách."
      }
    ]
  },
  {
    id: "deck_daily_comm",
    title: "Tiếng Anh Giao Tiếp Hằng Ngày",
    description: "Những từ vựng và cụm từ tự nhiên trong giao tiếp thường nhật của người bản xứ.",
    category: "Communication",
    cardCount: 5,
    isDefault: true,
    sourceType: "manual",
    createdAt: Date.now(),
    cards: [
      {
        id: "c_1",
        word: "Spontaneous",
        phonetic: "/spɑːnˈteɪ.ni.əs/",
        partOfSpeech: "adjective",
        meaning: "Tự phát, ngẫu hứng",
        exampleSentence: "We made a spontaneous decision to go on a road trip.",
        exampleTranslation: "Chúng tôi đã đưa ra quyết định ngẫu hứng đi du lịch bụi."
      },
      {
        id: "c_2",
        word: "Exhausted",
        phonetic: "/ɪɡˈzɑː.stɪd/",
        partOfSpeech: "adjective",
        meaning: "Kiệt sức, vô cùng mệt mỏi",
        exampleSentence: "I was completely exhausted after working for 12 hours straight.",
        exampleTranslation: "Tôi hoàn toàn kiệt sức sau khi làm việc 12 tiếng liên tục."
      },
      {
        id: "c_3",
        word: "Appreciate",
        phonetic: "/əˈpriː.ʃi.eɪt/",
        partOfSpeech: "verb",
        meaning: "Trân trọng, cảm kích",
        exampleSentence: "I really appreciate your timely assistance today.",
        exampleTranslation: "Tôi thực sự rất trân trọng sự giúp đỡ kịp thời của bạn hôm nay."
      },
      {
        id: "c_4",
        word: "Reluctant",
        phonetic: "/rɪˈlʌk.tənt/",
        partOfSpeech: "adjective",
        meaning: "Lưỡng lự, miễn cưỡng",
        exampleSentence: "He was reluctant to admit his honest mistake.",
        exampleTranslation: "Anh ấy đã miễn cưỡng thừa nhận sai lầm thành thật của mình."
      },
      {
        id: "c_5",
        word: "Enthusiastic",
        phonetic: "/ɪnˌθuː.ziˈæs.tɪk/",
        partOfSpeech: "adjective",
        meaning: "Nhiệt tình, hào hứng",
        exampleSentence: "The audience gave an enthusiastic applause.",
        exampleTranslation: "Khán giả đã dành một tràng pháo tay nhiệt tình."
      }
    ]
  }
];

