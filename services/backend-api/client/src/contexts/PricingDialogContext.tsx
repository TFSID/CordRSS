import { PropsWithChildren, createContext, useMemo } from "react";
import { useDisclosure } from "@chakra-ui/react";
import { useSearchParams } from "react-router-dom";
import { PricingDialog } from "../components/PricingDialog";

interface ContextProps {
  onOpen: () => void;
}

export const PricingDialogContext = createContext<ContextProps>({
  onOpen: () => {},
});

export const PricingDialogProvider = ({ children }: PropsWithChildren<{}>) => {
  const [searchParams] = useSearchParams();
  const priceId = searchParams.get("priceId");
  const { isOpen, onOpen, onClose } = useDisclosure({
    defaultIsOpen: !!priceId,
  });

  const value = useMemo(
    () => ({
      onOpen,
    }),
    [onOpen]
  );

  return (
    <PricingDialogContext.Provider value={value}>
      <PricingDialog isOpen={isOpen} onOpen={onOpen} onClose={onClose} openWithPriceId={priceId} />
      {children}
    </PricingDialogContext.Provider>
  );
};
