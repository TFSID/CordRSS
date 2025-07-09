import {
  Button,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
} from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { InferType, object, string } from "yup";
import { useEffect, useRef } from "react";

import RouteParams from "../../../../types/RouteParams";
import { useCreateDiscordChannelConnection } from "../../hooks";
import {
  DiscordActiveThreadDropdown,
  DiscordChannelDropdown,
  DiscordServerSearchSelectv2,
  GetDiscordChannelType,
} from "../../../discordServers";
import { notifySuccess } from "../../../../utils/notifySuccess";
import { SubscriberBlockText } from "@/components/SubscriberBlockText";
import { BlockableFeature, SupporterTier } from "../../../../constants";
import { InlineErrorAlert } from "../../../../components";

const formSchema = object({
  name: string().required("Name is required").max(250, "Name must be less than 250 characters"),
  serverId: string().required("Server ID is required"),
  channelId: string().required("Channel ID is required"),
  threadId: string().optional(),
  webhook: object({
    name: string().required("Webhook name is required"),
    iconUrl: string().optional(),
  }),
});

interface Props {
  onClose: () => void;
  isOpen: boolean;
}

type FormData = InferType<typeof formSchema>;

export const DiscordApplicationWebhookConnectionDialogContent: React.FC<Props> = ({
  onClose,
  isOpen,
}) => {
  const { feedId } = useParams<RouteParams>();
  const { t } = useTranslation();
  const {
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting, isValid },
  } = useForm<FormData>({
    resolver: yupResolver(formSchema),
    mode: "all",
  });
  const [serverId, channelId, threadId] = watch(["serverId", "channelId", "threadId"]);
  const { mutateAsync, error } = useCreateDiscordChannelConnection();
  const initialFocusRef = useRef<any>(null);

  const onSubmit = async ({ threadId: inputThreadId, name, webhook }: FormData) => {
    if (!feedId) {
      throw new Error("Feed ID missing while creating discord channel connection");
    }

    try {
      await mutateAsync({
        feedId,
        details: {
          name,
          applicationWebhook: {
            channelId,
            name: webhook.name,
            iconUrl: webhook.iconUrl,
            threadId: inputThreadId,
          },
        },
      });
      notifySuccess(
        "Succesfully added connection. New articles will be automatically delivered when found."
      );
      onClose();
    } catch (err) {}
  };

  useEffect(() => {
    reset();
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      closeOnOverlayClick={!isSubmitting}
      initialFocusRef={initialFocusRef}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Add a Discord webhook connection</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack spacing={4}>
            <Text>
              Send articles authored by a webhook with a custom name and icon as a message to a
              Discord channel or thread.
            </Text>
            <SubscriberBlockText
              feature={BlockableFeature.DiscordWebhooks}
              supporterTier={SupporterTier.Any}
              onClick={onClose}
            />
            <form id="addconnection" onSubmit={handleSubmit(onSubmit)}>
              <Stack spacing={4}>
                <FormControl isInvalid={!!errors.serverId} isRequired>
                  <FormLabel>
                    {t(
                      "features.feed.components.addDiscordWebhookConnectionDialog.formServerLabel"
                    )}
                  </FormLabel>
                  <Controller
                    name="serverId"
                    control={control}
                    render={({ field }) => (
                      <DiscordServerSearchSelectv2
                        {...field}
                        onChange={field.onChange}
                        value={field.value}
                        inputRef={initialFocusRef}
                        isDisabled={isSubmitting}
                      />
                    )}
                  />
                  <FormHelperText>
                    Only servers where you have server-wide Manage Channels permission will appear.
                    If you don&apos;t have this permission, you may ask someone who does to add the
                    feed and share it with you.
                  </FormHelperText>
                </FormControl>
                <FormControl isInvalid={!!errors.channelId} isRequired>
                  <FormLabel>Channel</FormLabel>
                  <Controller
                    name="channelId"
                    control={control}
                    render={({ field }) => (
                      <DiscordChannelDropdown
                        value={field.value || ""}
                        onChange={(value, name) => {
                          field.onChange(value);

                          if (name && !threadId) {
                            setValue("name", name, {
                              shouldDirty: true,
                              shouldTouch: true,
                              shouldValidate: true,
                            });
                            setValue("webhook.name", name, {
                              shouldDirty: true,
                              shouldTouch: true,
                              shouldValidate: true,
                            });
                          }
                        }}
                        include={[GetDiscordChannelType.Forum]}
                        onBlur={field.onBlur}
                        isDisabled={isSubmitting}
                        serverId={serverId}
                      />
                    )}
                  />
                  {errors.channelId && (
                    <FormErrorMessage>{errors.channelId?.message}</FormErrorMessage>
                  )}
                </FormControl>
                <FormControl isInvalid={!!errors.threadId?.message}>
                  <FormLabel>Forum Thread</FormLabel>
                  <Controller
                    name="threadId"
                    control={control}
                    render={({ field }) => (
                      <DiscordActiveThreadDropdown
                        value={field.value || ""}
                        onChange={(value, name) => {
                          field.onChange(value);

                          if (name) {
                            setValue("name", name, {
                              shouldDirty: true,
                              shouldTouch: true,
                              shouldValidate: true,
                            });
                            setValue("webhook.name", name, {
                              shouldDirty: true,
                              shouldTouch: true,
                              shouldValidate: true,
                            });
                          }
                        }}
                        onBlur={field.onBlur}
                        isDisabled={isSubmitting}
                        isClearable
                        serverId={serverId}
                        parentChannelId={channelId}
                      />
                    )}
                  />
                  {errors.threadId && (
                    <FormErrorMessage>{errors.threadId?.message}</FormErrorMessage>
                  )}
                  {!errors.threadId && (
                    <FormHelperText>
                      If specified, all messages will go into a specific thread. Only unlocked
                      (unarchived) threads are listed.
                    </FormHelperText>
                  )}
                </FormControl>
                <FormControl isInvalid={!!errors.webhook?.name} isRequired>
                  <FormLabel>
                    {t(
                      "features.feed.components.addDiscordWebhookConnectionDialog.webhookNameLabel"
                    )}
                  </FormLabel>
                  <Controller
                    name="webhook.name"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        isDisabled={isSubmitting}
                        value={field.value || ""}
                        bg="gray.800"
                      />
                    )}
                  />
                  {errors.webhook?.name && (
                    <FormErrorMessage>{errors.webhook.name.message}</FormErrorMessage>
                  )}
                  {!errors.webhook?.name && (
                    <FormHelperText>The username the webhook will use</FormHelperText>
                  )}
                </FormControl>
                <FormControl isInvalid={!!errors.webhook?.iconUrl}>
                  <FormLabel>
                    {t(
                      "features.feed.components.addDiscordWebhookConnectionDialog" +
                        ".webhookIconUrlLabel"
                    )}
                  </FormLabel>
                  <Controller
                    name="webhook.iconUrl"
                    control={control}
                    render={({ field }) => (
                      <Input
                        placeholder="Optional"
                        {...field}
                        isDisabled={isSubmitting}
                        value={field.value || ""}
                        bg="gray.800"
                      />
                    )}
                  />
                  {errors.webhook?.iconUrl && (
                    <FormErrorMessage>{errors.webhook.iconUrl.message}</FormErrorMessage>
                  )}
                </FormControl>
                <FormControl isInvalid={!!errors.name} isRequired>
                  <FormLabel>
                    {t(
                      "features.feed.components.addDiscordChannelThreadConnectionDialog.formNameLabel"
                    )}
                  </FormLabel>
                  <Controller
                    name="name"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        value={field.value || ""}
                        bg="gray.800"
                        isDisabled={isSubmitting}
                      />
                    )}
                  />
                  {errors.name && <FormErrorMessage>{errors.name.message}</FormErrorMessage>}
                  {!errors.name && (
                    <FormHelperText>
                      {t(
                        "features.feed.components" +
                          ".addDiscordChannelThreadConnectionDialog.formNameDescription"
                      )}
                    </FormHelperText>
                  )}
                </FormControl>
              </Stack>
            </form>
            {error && (
              <InlineErrorAlert
                title={t("common.errors.somethingWentWrong")}
                description={error.message}
              />
            )}
          </Stack>
        </ModalBody>
        <ModalFooter>
          <HStack>
            <Button variant="ghost" mr={3} onClick={onClose} isDisabled={isSubmitting}>
              <span>{t("common.buttons.cancel")}</span>
            </Button>
            <Button
              colorScheme="blue"
              type="submit"
              form="addconnection"
              isLoading={isSubmitting}
              isDisabled={isSubmitting || !isValid}
            >
              <span>{t("common.buttons.save")}</span>
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
