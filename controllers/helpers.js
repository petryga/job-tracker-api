const colors = [
  "#FACC00",
  "#FC8025",
  "#FB6A79",
  "#FB8355",
  "#FB6A85",
  "#EE649C",
  "#ACCF93",
  "#33AFFA",
  "#4177F7",
  "#637DB4",
  "#E84779",
  "#53C0A1",
  "#75DF9A",
];

const getRandomColor = () => {
  return colors[Math.floor(Math.random() * colors.length)];
};

const jobSearchCards = (cardID, cardID2) => {
  return [
    {
      _id: cardID,
      text: "Google",
      subtext: "Software Engineer",
      color: getRandomColor(),
      isFavorite: true,
    },
    {
      _id: cardID2,
      text: "Meta",
      subtext: "CEO",
      color: getRandomColor(),
      isFavorite: false,
    },
  ];
};

const jobSearchLists = (cardID, cardID2) => {
  return [
    {
      title: "Wishlist",
      cards: jobSearchCards(cardID, cardID2),
    },
    {
      title: "Applied",
      cards: [],
    },
    {
      title: "Follow-up",
      cards: [],
    },
    {
      title: "Interview",
      cards: [],
    },
    {
      title: "Offer",
      cards: [],
    },
    {
      title: "Rejected",
      cards: [],
    },
  ];
};

const notFoundError = (res, name) => {
  const text = `${name} not found`;

  res.status(404).json({ message: text });
  return;
};

module.exports = {
  getRandomColor,
  jobSearchLists,
  jobSearchCards,
  notFoundError,
};
