import { toast } from "@/components/ui/use-toast";
import {
  fuelConsumptionRatio,
  fuelTankCapacity,
  planets,
  refuelingStations,
} from "@/utils/constants";
import { formatNumber, getDistance } from "@/utils/functions";
import { atom, useAtom, useAtomValue } from "jotai";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { langAtom } from "../langAtom";

const currentPlanetAtom = atom<string>("earth");
const destinationPlanetAtom = atom<string>("");
const availableFuelAtom = atom<number>(fuelTankCapacity);
const travelHistoryAtom = atom<
  {
    currentPlanet: string;
    destinationPlanet: string;
    availableFuel: number;
    requiredFuel: number;
    createdAt: Date;
  }[]
>([]);

// Átomo de somente leitura para calcular o combustível necessário
const requiredFuelAtom = atom<number>((get) => {
  const currentPlanet = get(currentPlanetAtom);
  const destinationPlanet = get(destinationPlanetAtom);

  // Calcula o combustível necessário multiplicando a distância pelo consumo de combustível.
  // Se nenhum destino for selecionado, o combustível necessário é zero.
  return destinationPlanet
    ? getDistance(currentPlanet, destinationPlanet) * fuelConsumptionRatio
    : 0;
});

// Átomo de somente leitura para verificar se a viagem é possível
const isTripPossibleAtom = atom<boolean>((get) => {
  const availableFuel = get(availableFuelAtom);
  const requiredFuel = get(requiredFuelAtom);

  // Verifica se o combustível disponível é suficiente para a viagem.
  return availableFuel >= requiredFuel;
});

// Átomo de somente leitura para verificar se está encalhado
const isStrandedAtom = atom<boolean>((get) => {
  // Obtém o planeta atual.
  const currentPlanet = get(currentPlanetAtom);
  // Obtém o combustível disponível.
  const availableFuel = get(availableFuelAtom);

  // Verifica se há alguma estação de reabastecimento ao alcance com o combustível disponível.
  const canReachAnyRefuelingStation = refuelingStations.some((station) => {
    const distanceToStation = getDistance(currentPlanet, station);
    return availableFuel >= distanceToStation * fuelConsumptionRatio;
  });

  // Verifica se pode alcançar qualquer outro planeta que não seja o atual.
  const canReachAnyPlanet = planets.some((planet) => {
    if (planet.name !== currentPlanet) {
      const distanceToPlanet = getDistance(currentPlanet, planet.name);
      return availableFuel >= distanceToPlanet * fuelConsumptionRatio;
    }
    return false;
  });

  // Retorna true se não puder alcançar nenhuma estação de reabastecimento ou outro planeta.
  return !(canReachAnyRefuelingStation || canReachAnyPlanet);
});

export function useSpaceTravelStore() {
  const t = useTranslations("home");

  const [currentPlanet, setCurrentPlanet] = useAtom(currentPlanetAtom);
  const [destinationPlanet, setDestinationPlanet] = useAtom(
    destinationPlanetAtom
  );
  const [availableFuel, setAvailableFuel] = useAtom(availableFuelAtom);
  const [travelHistory, setTravelHistory] = useAtom(travelHistoryAtom);

  const requiredFuel = useAtomValue(requiredFuelAtom);
  const isTripPossible = useAtomValue(isTripPossibleAtom);
  const isStranded = useAtomValue(isStrandedAtom);
  const lang = useAtomValue(langAtom);

  // Função para encontrar a estação de reabastecimento mais próxima.
  // Usa a função getDistance para calcular a distância entre a localização atual e cada estação disponível,
  // excluindo a possibilidade do planeta atual ser considerado uma estação de reabastecimento.
  const nearestRefuelStation = (() => {
    // Inicializa a variável que vai armazenar a estação mais próxima.
    let closestStation = null;
    // Define a distância inicial como infinita para garantir que qualquer distância real seja menor.
    let minDistance = Infinity;

    // Filtra as estações de reabastecimento para excluir o planeta atual da lista de verificações,
    // pois não podemos considerar o planeta atual como uma opção de reabastecimento.
    refuelingStations
      .filter((station) => station !== currentPlanet)
      .forEach((station) => {
        // Calcula a distância do planeta atual até a estação que está sendo iterada.
        const distance = getDistance(currentPlanet, station);

        // Se a distância calculada for menor que a menor distância encontrada até agora,
        // atualiza a menor distância e a estação mais próxima.
        if (distance < minDistance) {
          minDistance = distance;
          closestStation = station;
        }
      });

    // Retorna a estação mais próxima encontrada ou null se nenhuma for acessível.
    return closestStation;
  })();

  // Executa a viagem se possível, atualiza o histórico e mostra uma notificação relevante.
  const submitTrip = useCallback(() => {
    if (isTripPossible) {
      // Atualiza a localização atual para o destino escolhido.
      setCurrentPlanet(destinationPlanet);
      // Deduz o combustível necessário do combustível disponível.
      setAvailableFuel((prevFuel) => prevFuel - requiredFuel);
      // Adiciona a viagem atual ao histórico de viagens.
      setTravelHistory((prevHistory) => [
        ...prevHistory,
        {
          currentPlanet,
          destinationPlanet,
          availableFuel,
          requiredFuel,
          createdAt: new Date(),
        },
      ]);
      // Exibe uma notificação de sucesso.
      toast({
        variant: "positive",
        title: t("trip-successful-title", {
          from: t(currentPlanet),
          to: t(destinationPlanet),
        }),
        description: t("trip-successful-description", {
          spentFuel: t("fuel-capacity-in-liters", {
            fuel: formatNumber(requiredFuel, lang),
          }),
          remainingFuel: t("fuel-capacity-in-liters", {
            fuel: formatNumber(availableFuel - requiredFuel, lang),
          }),
        }),
      });
      // Reseta o destino selecionado após a viagem.
      setDestinationPlanet("");
      return true;
    } else {
      // Exibe uma notificação de erro se a viagem não for possível.
      toast({
        variant: "destructive",
        title: t("trip-not-possible-title", {
          from: t(currentPlanet),
          to: t(destinationPlanet),
        }),
        description: t("trip-not-possible-description", {
          spentFuel: t("fuel-capacity-in-liters", {
            fuel: formatNumber(requiredFuel, lang),
          }),
          remainingFuel: t("fuel-capacity-in-liters", {
            fuel: formatNumber(availableFuel, lang),
          }),
        }),
      });
      return false;
    }
  }, [
    isTripPossible,
    currentPlanet,
    destinationPlanet,
    availableFuel,
    requiredFuel,
  ]);

  // Reabastece o tanque até a sua capacidade máxima.
  const refuel = useCallback(() => {
    setAvailableFuel(fuelTankCapacity);
  }, [currentPlanet]);

  // Função de restart: Limpa o histórico, reseta o combustível e mantém o planeta atual
  const restart = useCallback(() => {
    setCurrentPlanet("earth");
    setDestinationPlanet("");
    setAvailableFuel(fuelTankCapacity);
    setTravelHistory([]);
    toast({
      variant: "positive",
      title: "Restart Successful",
      description:
        "The game has been restarted. All travel history has been cleared.",
    });
  }, []);

  // Função de undo: Desfaz a última viagem feita
  const undoLastTrip = useCallback(() => {
    setTravelHistory((prevHistory) => {
      if (prevHistory.length === 0) return prevHistory;

      // Ordena o histórico de viagens por data de criação, do mais recente para o mais antigo.
      const sortedHistory = [...prevHistory].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );

      // Obtém a última viagem do histórico ordenado.
      const lastTrip = sortedHistory[0];

      // Atualiza o planeta atual e o combustível disponível com os valores da última viagem.
      setCurrentPlanet(lastTrip.currentPlanet);
      setAvailableFuel(lastTrip.availableFuel);
      toast({
        variant: "positive",
        title: "Undo Successful",
        description: `Undid the last trip from ${lastTrip.destinationPlanet} to ${lastTrip.currentPlanet}.`,
      });

      // Retorna o histórico de viagens sem a última viagem.
      return sortedHistory.slice(1);
    });
  }, [setCurrentPlanet, setAvailableFuel]);

  return {
    currentPlanet,
    destinationPlanet,
    availableFuel,
    travelHistory,
    isTripPossible,
    nearestRefuelStation,
    requiredFuel,
    isStranded,
    methods: {
      setCurrentPlanet,
      setDestinationPlanet,
      setAvailableFuel,
      setTravelHistory,
      submitTrip,
      refuel,
      restart,
      undoLastTrip,
    },
  };
}
