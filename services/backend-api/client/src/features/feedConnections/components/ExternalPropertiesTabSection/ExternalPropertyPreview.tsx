import {
  Alert,
  AlertDescription,
  AlertTitle,
  Box,
  Button,
  Center,
  Code,
  FormControl,
  FormLabel,
  HStack,
  Link,
  Select,
  Skeleton,
  Spinner,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import { useState } from "react";
import { ExternalLinkIcon, RepeatIcon } from "@chakra-ui/icons";
import { Link as RouterLink } from "react-router-dom";
import { useUserFeedContext } from "../../../../contexts/UserFeedContext";
import { ExternalProperty } from "../../../../types";
import { ArticleSelectDialog, SelectArticlePropertyType, useUserFeedArticles } from "../../../feed";
import { useGetUserFeedArticlesError } from "../../hooks";
import { useDebounce } from "../../../../hooks";
import { pages } from "../../../../constants";
import { UserFeedTabSearchParam } from "../../../../constants/userFeedTabSearchParam";
import {
  UserFeedConnectionContext,
  UserFeedConnectionProvider,
  useUserFeedConnectionContext,
} from "../../../../contexts/UserFeedConnectionContext";

interface Props {
  externalProperties: ExternalProperty[];
  disabled?: boolean;
}

const ArticlesSection = ({
  externalProperties,
  disabled,
  articleId,
}: Props & { articleId?: string }) => {
  const { userFeed, articleFormatOptions } = useUserFeedConnectionContext();
  const isIncomplete = externalProperties.some((i) => !i.sourceField || !i.cssSelector || !i.label);

  const { data, status, error, fetchStatus } = useUserFeedArticles({
    data: {
      limit: 1,
      skip: 0,
      selectProperties: ["id", ...externalProperties.map((p) => p.sourceField)],
      filters: articleId
        ? {
            articleId,
          }
        : undefined,
      random: true,
      selectPropertyTypes: [SelectArticlePropertyType.ExternalInjections],
      formatOptions: {
        formatTables: articleFormatOptions?.formatTables ?? false,
        stripImages: articleFormatOptions?.stripImages ?? false,
        disableImageLinkPreviews: articleFormatOptions?.disableImageLinkPreviews ?? false,
        ignoreNewLines: articleFormatOptions?.ignoreNewLines ?? false,
        dateFormat: articleFormatOptions?.dateFormat,
        dateTimezone: articleFormatOptions?.dateTimezone,
        customPlaceholders: [],
        externalProperties,
      },
    },
    disabled: disabled || externalProperties.length === 0 || isIncomplete,
    feedId: userFeed.id,
  });

  const articleEntries = Object.entries(data?.result.articles[0] || {}).filter(
    ([key, value]) => key.startsWith("external::") && !!value
  );

  const { alertComponent, hasAlert } = useGetUserFeedArticlesError({
    getUserFeedArticlesStatus: status,
    getUserFeedArticlesError: error,
    getUserFeedArticlesOutput: data,
  });

  if (hasAlert) {
    return alertComponent;
  }

  const article = data?.result.articles[0] as Record<string, string> | undefined;

  if (!article) {
    return (
      <Alert status="info" rounded="lg">
        <AlertTitle>No articles were found in the feed to preview</AlertTitle>
      </Alert>
    );
  }

  if (!articleEntries.length) {
    return (
      <Alert status="info" justifyContent="center">
        <AlertDescription>
          No additional properties were generated for this article. If this is unexpected, consider
          adjusting your CSS selector.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Stack>
      <Box padding={2} rounded="lg" maxHeight={300} overflow="scroll">
        <TableContainer>
          <Table size="sm" variant="simple">
            <Thead>
              <Tr>
                <Th>Generated Property</Th>
                <Th>Value</Th>
              </Tr>
            </Thead>
            <Tbody>
              {articleEntries.map(([key, value]) => {
                return (
                  <Tr key={key}>
                    <Td>
                      <Skeleton isLoaded={fetchStatus === "idle"}>
                        <Code>{key}</Code>
                      </Skeleton>
                    </Td>
                    <Td>
                      <Skeleton isLoaded={fetchStatus === "idle"}>{value}</Skeleton>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </TableContainer>
      </Box>
      <Stack>
        <Text fontSize="sm" color="whiteAlpha.700" textAlign="center">
          These generated properties may be used while creating custom message formats per
          connection.
        </Text>
      </Stack>
    </Stack>
  );
};

export const ExternalPropertyPreview = ({
  externalProperties: inputExternalProperties,
  disabled,
}: Props) => {
  const { userFeed, articleFormatOptions } = useUserFeedContext();
  const [selectedConnectionId, setSelectedConnectionId] = useState<string>(
    userFeed.connections[0]?.id
  );
  const [articleId, setArticleId] = useState<string | undefined>();
  const { externalProperties } = useDebounce({ externalProperties: inputExternalProperties }, 500);
  const isIncomplete = externalProperties.some((i) => !i.sourceField || !i.cssSelector || !i.label);

  const { data, status, error, fetchStatus } = useUserFeedArticles({
    data: {
      limit: 1,
      skip: 0,
      selectProperties: ["id"],
      random: true,
      formatOptions: {
        formatTables: false,
        stripImages: false,
      },
    },
    disabled: disabled || externalProperties.length === 0,
    feedId: userFeed.id,
  });

  const { alertComponent, hasAlert } = useGetUserFeedArticlesError({
    getUserFeedArticlesStatus: status,
    getUserFeedArticlesError: error,
    getUserFeedArticlesOutput: data,
  });

  const onChangeSelectedConnection = (connectionId: string) => {
    setSelectedConnectionId(connectionId);
  };

  if (hasAlert) {
    return alertComponent;
  }

  const articleEntries = Object.entries(data?.result.articles[0] || {}).filter(
    ([key, value]) => key.startsWith("external::") && !!value
  );

  if (isIncomplete) {
    return (
      <Alert status="warning" justifyContent="center" rounded="lg">
        <AlertDescription>
          The preview is disabled because one or more input fields are incomplete. Please fill in
          all required fields.
        </AlertDescription>
      </Alert>
    );
  }

  if (!userFeed.connections.length) {
    return (
      <Alert status="warning" justifyContent="center" rounded="lg">
        <AlertDescription>
          The preview is disabled because there are no connections within this feed to preview with.
          To create connections, visit the{" "}
          <Link
            as={RouterLink}
            color="blue.300"
            to={pages.userFeed(userFeed.id, {
              tab: UserFeedTabSearchParam.Connections,
            })}
          >
            Connections
          </Link>{" "}
          page.
        </AlertDescription>
      </Alert>
    );
  }

  if (
    !data ||
    status === "loading" ||
    (data && !articleEntries.length && fetchStatus === "fetching")
  ) {
    return (
      <Center flexDir="column" gap={2} bg="gray.800" rounded="lg" p={4}>
        <Spinner />
        <Text color="whiteAlpha.700" fontSize="sm">
          Loading preview...this might take a while
        </Text>
      </Center>
    );
  }

  const article = data?.result.articles[0] as Record<string, string> | undefined;

  if (!article) {
    return (
      <Alert status="info" rounded="lg">
        <AlertTitle>No articles were found in the feed to preview</AlertTitle>
      </Alert>
    );
  }

  return (
    <Stack px={[4, 4, 6]} py={4}>
      <UserFeedConnectionProvider feedId={userFeed.id} connectionId={selectedConnectionId}>
        <UserFeedConnectionContext.Consumer>
          {(connectionContext) => {
            return (
              <>
                <ArticleSelectDialog
                  trigger={
                    <Button size="sm" leftIcon={<RepeatIcon />}>
                      Change Preview Article
                    </Button>
                  }
                  feedId={userFeed.id}
                  onArticleSelected={(id) => setArticleId(id)}
                  articleFormatOptions={articleFormatOptions}
                />
                <HStack>
                  <FormControl>
                    <FormLabel>
                      External Pages from Preview Article (
                      <HStack display="inline">
                        {externalProperties.map((p) => (
                          <Code key={p.id}>{p.sourceField}</Code>
                        ))}
                      </HStack>
                      )
                    </FormLabel>
                    <Stack>
                      {externalProperties.map(({ sourceField, id }) => {
                        const href = article[sourceField];

                        if (!href) {
                          return null;
                        }

                        return (
                          <Link
                            key={id}
                            gap={2}
                            isExternal
                            target="_blank"
                            href={href || undefined}
                            rel="noopener noreferrer"
                            color="blue.300"
                          >
                            {href}
                            <ExternalLinkIcon paddingLeft={1} />
                          </Link>
                        );
                      })}
                    </Stack>
                  </FormControl>
                </HStack>
                <HStack>
                  <FormControl flex={1}>
                    <FormLabel>Preview Connection</FormLabel>
                    <HStack flexWrap="wrap">
                      <Select
                        size="sm"
                        width="auto"
                        flex={1}
                        minWidth={200}
                        onChange={(e) => onChangeSelectedConnection(e.target.value)}
                      >
                        {userFeed.connections.map((con) => (
                          <option key={con.id} value={con.id}>
                            {con.name}
                          </option>
                        ))}
                      </Select>
                      {connectionContext && (
                        <Button
                          size="sm"
                          variant="ghost"
                          as={Link}
                          href={pages.userFeedConnection({
                            feedId: userFeed.id,
                            connectionId: connectionContext.connection.id,
                            connectionType: connectionContext.connection.key,
                          })}
                          target="_blank"
                          rightIcon={<ExternalLinkIcon />}
                        >
                          Manage Connection
                        </Button>
                      )}
                    </HStack>
                  </FormControl>
                </HStack>
                <ArticlesSection
                  externalProperties={externalProperties}
                  articleId={articleId}
                  disabled={disabled}
                />
              </>
            );
          }}
        </UserFeedConnectionContext.Consumer>
      </UserFeedConnectionProvider>
    </Stack>
  );
};
