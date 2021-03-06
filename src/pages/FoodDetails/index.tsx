import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Image } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
  Container,
  Header,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdittionalItem,
  AdittionalItemText,
  AdittionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
} from './styles';

interface Params {
  id: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  category: number;
  image_url: string;
  formattedPrice: string;
  thumbnail_url: string;
  extras: Extra[];
}

const FoodDetails: React.FC = () => {
  const [food, setFood] = useState({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [foodQuantity, setFoodQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);

  const navigation = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;

  useEffect(() => {
    async function loadFood(): Promise<void> {
      const { data } = await api.get<Food>(`foods/${routeParams.id}`);
      setFood({
        ...data,
        formattedPrice: formatValue(data.price),
      });

      setExtras(
        data.extras.map(extra => ({
          ...extra,
          quantity: 0,
        })),
      );
    }

    loadFood();
  }, [routeParams]);

  function handleIncrementExtra(id: number): void {
    setExtras(state =>
      state.map(extra =>
        // extra.id === id && extra.quantity < foodQuantity
        extra.id === id
          ? {
              ...extra,
              quantity: extra.quantity + 1,
            }
          : extra,
      ),
    );
  }

  function handleDecrementExtra(id: number): void {
    setExtras(state =>
      state.map(extra =>
        extra.id === id
          ? {
              ...extra,
              quantity: extra.quantity > 0 ? extra.quantity - 1 : 0,
            }
          : extra,
      ),
    );
  }

  function handleIncrementFood(): void {
    setFoodQuantity(state => state + 1);
  }

  function handleDecrementFood(): void {
    const newFoodQuantity = foodQuantity > 1 ? foodQuantity - 1 : 1;

    // setExtras(state =>
    //   state.map(extra => ({
    //     ...extra,
    //     quantity:
    //       newFoodQuantity < extra.quantity ? newFoodQuantity : extra.quantity,
    //   })),
    // );

    setFoodQuantity(newFoodQuantity);
  }

  const cartTotal = useMemo(() => {
    let priceExtra = 0;

    extras.forEach(({ value, quantity }) => {
      priceExtra += value * quantity;
    });

    return formatValue(food.price * foodQuantity + priceExtra);
  }, [extras, food, foodQuantity]);

  const toggleFavorite = useCallback(() => {
    if (isFavorite) {
      api.delete(`favorites/${food.id}`);
    } else {
      api.post('favorites', {
        id: food.id,
        name: food.name,
        description: food.description,
        price: food.price,
        category: food.category,
        image_url: food.image_url,
        thumbnail_url: food.thumbnail_url,
      });
    }
    setIsFavorite(!isFavorite);
  }, [isFavorite, food]);

  async function handleFinishOrder(): Promise<void> {
    const { id, name, description, price, category, thumbnail_url } = food;

    await api.post('orders', {
      product_id: id,
      name,
      description,
      price,
      category,
      thumbnail_url,
      extras: food.extras,
    });

    navigation.navigate('DashboardStack');
  }

  const favoriteIconName = useMemo(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );

  useEffect(() => {
    async function getFavorite(): Promise<void> {
      const response = await api.get('favorites', {
        params: {
          id: routeParams.id,
        },
      });

      setIsFavorite(response.data.length > 0);
    }

    getFavorite();
  }, [routeParams.id]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);

  return (
    <Container>
      <Header />

      <ScrollContainer>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </FoodImageContainer>
            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{food.formattedPrice}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>
        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {extras.map(extra => (
            <AdittionalItem key={extra.id}>
              <AdittionalItemText>{extra.name}</AdittionalItemText>
              <AdittionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </AdittionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdittionalQuantity>
            </AdittionalItem>
          ))}
        </AdditionalsContainer>
        <TotalContainer>
          <Title>Total do pedido</Title>
          <PriceButtonContainer>
            <TotalPrice testID="cart-total">{cartTotal}</TotalPrice>
            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <AdittionalItemText testID="food-quantity">
                {foodQuantity}
              </AdittionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={handleFinishOrder}>
            <ButtonText>Confirmar pedido</ButtonText>
            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>
    </Container>
  );
};

export default FoodDetails;
