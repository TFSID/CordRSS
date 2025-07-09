import { WarningTwoIcon } from "@chakra-ui/icons";
import { Code, Divider, Heading, Stack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

interface Props {
  description?: string;
}

export const ErrorAlert: React.FC<Props> = ({ description }) => {
  const { t } = useTranslation();

  return (
    <Stack
      display="flex"
      flexDir="column"
      alignItems="center"
      justifyContent="center"
      height="100%"
      paddingBottom="10rem"
      textAlign="center"
      paddingX="12"
      spacing="6"
    >
      <Stack display="flex" justifyContent="center" alignItems="center">
        <WarningTwoIcon fontSize="8rem" color="red.500" />
        <Heading>{t("common.errors.somethingWentWrong")}</Heading>
        <Text fontSize="lg">{t("common.errors.tryAgainLater")}</Text>
      </Stack>
      {description && (
        <>
          <Divider maxWidth="50%" />
          <Stack>
            <Text color="gray.500">{t("common.errors.detailsTitle")}</Text>
            <Code marginTop="4" color="gray.400">
              {description}
            </Code>
          </Stack>
        </>
      )}
    </Stack>
  );
};
