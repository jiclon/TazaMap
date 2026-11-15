// Текст политики конфиденциальности на трёх языках.
//
// ВАЖНО: это черновик простым языком, а не документ от юриста. Перед открытым запуском
// покажите его юристу (в том числе вопрос о хранении данных на серверах за пределами Казахстана)
// и допишите, кто отвечает за данные: ФИО или название организации и способ связи.
// Казахский перевод нужно вычитать носителю языка.
import type { Lang } from "./types";

export interface Policy {
  updated: string; // дата последнего изменения, ГГГГ-ММ-ДД
  intro: string[];
  sections: { title: string; items: string[] }[];
  contact: string; // {contact} заменяется на CONTACT из config.ts
}

const UPDATED = "2026-11-14";

export const POLICY: Record<Lang, Policy> = {
  ru: {
    updated: UPDATED,
    intro: [
      "TazaMap — карта мусора и уборок Петропавловска. Здесь простыми словами написано, какие данные мы собираем и что с ними делаем.",
      "За обработку данных отвечает команда проекта TazaMap (Петропавловск, Казахстан).",
    ],
    sections: [
      {
        title: "Какие данные мы собираем",
        items: [
          "Имя и номер телефона: вы указываете их при регистрации.",
          "Пароль. Мы храним не сам пароль, а его хеш: по хешу нельзя узнать пароль.",
          "Места, которые вы отметили: фото, точка на карте, описание и время.",
          "Уборки, которые вы создали: дата, место сбора и ссылка на чат.",
          "Технические данные: хостинг может записывать IP-адрес и время запросов в журналах.",
        ],
      },
      {
        title: "Зачем они нужны",
        items: [
          "Чтобы вы могли войти в аккаунт.",
          "Чтобы показывать отмеченные места и уборки на карте.",
          "Чтобы проверять отметки и честно начислять монеты.",
          "Чтобы связаться с вами по вопросам аккаунта.",
          "Мы не продаём ваши данные и не показываем рекламу.",
        ],
      },
      {
        title: "Что видят другие люди",
        items: [
          "Отмеченные места, их фото и описания видны всем посетителям сайта.",
          "Ваше имя может показываться рядом с вашими отметками и уборками и в рейтинге.",
          "Номер телефона другим пользователям не показывается.",
          "Не загружайте фото, на которых видны лица людей или номера машин.",
        ],
      },
      {
        title: "Где хранятся данные",
        items: [
          "В базе данных на серверах облачных сервисов Neon и Render. Эти серверы находятся за пределами Казахстана.",
          "В вашем браузере хранятся только ключ входа, выбранный язык и тема. Рекламных и следящих cookie нет.",
          "Карта загружается с серверов OpenStreetMap и 2GIS, шрифты загружаются с Google Fonts. Эти сервисы получают ваш IP-адрес, как при открытии любого сайта.",
        ],
      },
      {
        title: "Сколько мы их храним",
        items: [
          "Пока у вас есть аккаунт.",
          "По вашей просьбе мы удалим аккаунт и связанные с ним личные данные.",
        ],
      },
      {
        title: "Если вам меньше 18 лет",
        items: ["Регистрируйтесь с согласия родителей или законных представителей."],
      },
      {
        title: "Ваши права",
        items: [
          "Узнать, какие данные о вас мы храним.",
          "Исправить имя или номер телефона.",
          "Отозвать согласие и удалить аккаунт.",
        ],
      },
      {
        title: "Изменения",
        items: [
          "Если политика изменится, мы обновим дату вверху этой страницы и сообщим об этом в Telegram-канале TazaMap.",
        ],
      },
    ],
    contact: "Чтобы воспользоваться правами или задать вопрос, напишите нам: {contact}.",
  },

  kk: {
    updated: UPDATED,
    intro: [
      "TazaMap — Петропавлдағы қоқыс пен тазалау картасы. Мұнда қандай деректерді жинайтынымыз және оларды не үшін қолданатынымыз қарапайым тілмен жазылған.",
      "Деректерді өңдеуге TazaMap жобасының командасы жауап береді (Петропавл, Қазақстан).",
    ],
    sections: [
      {
        title: "Қандай деректерді жинаймыз",
        items: [
          "Атыңыз бен телефон нөміріңіз: оларды тіркелу кезінде өзіңіз көрсетесіз.",
          "Құпиясөз. Біз құпиясөздің өзін емес, оның хешін сақтаймыз: хеш арқылы құпиясөзді білу мүмкін емес.",
          "Сіз белгілеген орындар: фото, картадағы нүкте, сипаттама және уақыт.",
          "Сіз құрған тазалаулар: күні, жиналатын жер және чат сілтемесі.",
          "Техникалық деректер: хостинг журналдарға IP-мекенжай мен сұраныс уақытын жазуы мүмкін.",
        ],
      },
      {
        title: "Олар не үшін қажет",
        items: [
          "Аккаунтқа кіруіңіз үшін.",
          "Белгіленген орындар мен тазалауларды картада көрсету үшін.",
          "Белгілерді тексеріп, монеталарды әділ есептеу үшін.",
          "Аккаунт мәселелері бойынша сізбен байланысу үшін.",
          "Біз деректеріңізді сатпаймыз және жарнама көрсетпейміз.",
        ],
      },
      {
        title: "Басқа адамдар нені көреді",
        items: [
          "Белгіленген орындар, олардың фотолары мен сипаттамалары сайтқа кірген барлық адамға көрінеді.",
          "Атыңыз белгілеген орындарыңыз бен тазалауларыңыздың жанында және рейтингте көрсетілуі мүмкін.",
          "Телефон нөміріңіз басқа пайдаланушыларға көрсетілмейді.",
          "Адамдардың беті немесе көлік нөмірлері көрінетін фотоларды жүктемеңіз.",
        ],
      },
      {
        title: "Деректер қайда сақталады",
        items: [
          "Neon және Render бұлттық қызметтерінің серверлеріндегі дерекқорда. Бұл серверлер Қазақстаннан тыс жерде орналасқан.",
          "Браузеріңізде тек кіру кілті, таңдалған тіл және тақырып сақталады. Жарнамалық және бақылаушы cookie файлдары жоқ.",
          "Карта OpenStreetMap және 2GIS серверлерінен, қаріптер Google Fonts-тан жүктеледі. Кез келген сайтты ашқандағыдай, бұл қызметтер сіздің IP-мекенжайыңызды алады.",
        ],
      },
      {
        title: "Қанша уақыт сақтаймыз",
        items: [
          "Аккаунтыңыз бар кезде.",
          "Өтінішіңіз бойынша аккаунтты және онымен байланысты жеке деректерді жоямыз.",
        ],
      },
      {
        title: "Егер жасыңыз 18-ге толмаса",
        items: ["Ата-анаңыздың немесе заңды өкілдеріңіздің келісімімен тіркеліңіз."],
      },
      {
        title: "Сіздің құқықтарыңыз",
        items: [
          "Сіз туралы қандай деректер сақталғанын білу.",
          "Атыңызды немесе телефон нөміріңізді түзету.",
          "Келісімді қайтарып алып, аккаунтты жою.",
        ],
      },
      {
        title: "Өзгерістер",
        items: [
          "Саясат өзгерсе, осы беттің жоғарғы жағындағы күнді жаңартып, TazaMap Telegram-арнасында хабарлаймыз.",
        ],
      },
    ],
    contact: "Құқықтарыңызды пайдалану немесе сұрақ қою үшін бізге жазыңыз: {contact}.",
  },

  en: {
    updated: UPDATED,
    intro: [
      "TazaMap is a map of litter and cleanups in Petropavl. This page explains in plain words what data we collect and what we do with it.",
      "The TazaMap project team (Petropavl, Kazakhstan) is responsible for handling the data.",
    ],
    sections: [
      {
        title: "What we collect",
        items: [
          "Your name and phone number: you give them when you sign up.",
          "Your password. We store a hash, not the password itself: the hash can’t be turned back into the password.",
          "Places you mark: the photo, the point on the map, the description and the time.",
          "Cleanups you create: the date, the meeting point and the chat link.",
          "Technical data: our hosting may record IP addresses and request times in its logs.",
        ],
      },
      {
        title: "Why we need it",
        items: [
          "So you can sign in to your account.",
          "To show marked places and cleanups on the map.",
          "To check marked places and award coins fairly.",
          "To contact you about your account.",
          "We don’t sell your data and we don’t show ads.",
        ],
      },
      {
        title: "What other people see",
        items: [
          "Marked places, their photos and descriptions are visible to everyone who visits the site.",
          "Your name may be shown next to your places and cleanups and in the ranking.",
          "Your phone number is not shown to other users.",
          "Don’t upload photos that show people’s faces or car number plates.",
        ],
      },
      {
        title: "Where the data is stored",
        items: [
          "In a database on servers of the cloud services Neon and Render. These servers are located outside Kazakhstan.",
          "Your browser stores only the sign-in key, your language and your theme. There are no advertising or tracking cookies.",
          "The map loads from OpenStreetMap and 2GIS servers, and fonts load from Google Fonts. These services receive your IP address, as happens when you open any website.",
        ],
      },
      {
        title: "How long we keep it",
        items: [
          "For as long as you have an account.",
          "If you ask us, we will delete your account and the personal data linked to it.",
        ],
      },
      {
        title: "If you are under 18",
        items: ["Sign up with the consent of your parents or legal guardians."],
      },
      {
        title: "Your rights",
        items: [
          "Find out what data we hold about you.",
          "Correct your name or phone number.",
          "Withdraw your consent and delete your account.",
        ],
      },
      {
        title: "Changes",
        items: [
          "If this policy changes, we will update the date at the top of this page and announce it in the TazaMap Telegram channel.",
        ],
      },
    ],
    contact: "To use your rights or ask a question, write to us: {contact}.",
  },
};
