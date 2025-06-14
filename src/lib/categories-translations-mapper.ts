export const getTranslatedCategoryName = (
  category: string,
  t: (key: string) => string
) => {
  const translationKeyMap: Record<string, string> = {
    'Restaurants & Cafés': 'food',
    'Food & Dining': 'food',
    'Їжа та ресторани': 'food',
    Clothing: 'shopping',
    Шопінг: 'shopping',
    Transportation: 'transportation',
    Транспорт: 'transportation',
    'Bills & Utilities': 'bills',
    'Комунальні послуги': 'bills',
    Entertainment: 'entertainment',
    Розваги: 'entertainment',
    Healthcare: 'healthcare',
    "Здоров'я": 'healthcare',
    Education: 'education',
    Освіта: 'education',
    Travel: 'travel',
    Подорожі: 'travel',
    Presents: 'presents',
    Подарунки: 'presents',
    Other: 'other',
    Інше: 'other',
    Donations: 'donations',
    Пожертви: 'donations',
    Subscriptions: 'subscriptions',
    Підписки: 'subscriptions',
    Groceries: 'groceries',
    Продукти: 'groceries',
    Car: 'car',
    Автомобіль: 'car',
    Home: 'home',
    Дім: 'home',
    Taxes: 'taxes',
    Податки: 'taxes',
    Electronics: 'electronics',
    Електроніка: 'electronics',
    Children: 'children',
    Діти: 'children',
    Parents: 'parents',
    Батьки: 'parents',
    Pets: 'pets',
    Тварини: 'pets',
    Sport: 'sport',
    Спорт: 'sport',
    'Style and Beauty': 'beauty',
    'Стиль та краса': 'beauty',
    Extra: 'extra',
    Додатково: 'extra',
    Salary: 'salary',
    Зарплата: 'salary'
  }

  // First try to get the translation key from our map
  const translationKey = translationKeyMap[category]

  // If we have a translation key, use it
  if (translationKey) {
    const translated = t(`categories.system.${translationKey}`)
    return translated === `categories.system.${translationKey}`
      ? category
      : translated
  }

  // If no translation key is found, just return the original category name
  return category
}
