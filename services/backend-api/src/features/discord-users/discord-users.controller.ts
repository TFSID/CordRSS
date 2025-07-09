import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Req,
  Session,
  UseGuards,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { FastifyRequest } from "fastify";
import { DiscordAPIError } from "../../common/errors/DiscordAPIError";
import { TransformValidationPipe } from "../../common/pipes/TransformValidationPipe";
import { DiscordAccessToken } from "../discord-auth/decorators/DiscordAccessToken";
import { DiscordAuthService } from "../discord-auth/discord-auth.service";
import { DiscordOAuth2Guard } from "../discord-auth/guards/DiscordOAuth2.guard";
import { SessionAccessToken } from "../discord-auth/types/SessionAccessToken.type";
import { getAccessTokenFromRequest } from "../discord-auth/utils/get-access-token-from-session";
import { DiscordUsersService } from "./discord-users.service";
import {
  GetMeAuthStatusOutputDto,
  GetUserOutputDto,
  UpdateSupporterInputDto,
} from "./dto";
import { GetBotOutputDto } from "./dto/GetBotOutput.dto";
import { GetMyServersOutputDto } from "./dto/GetMyServersOutput.dto";
import { DiscordUserIsSupporterGuard } from "./guards/DiscordUserIsSupporter";

@Controller("discord-users")
export class DiscordUsersController {
  constructor(
    private readonly discordUsersService: DiscordUsersService,
    private readonly configService: ConfigService,
    private readonly discordAuthService: DiscordAuthService
  ) {}

  @Get("/:id")
  @UseGuards(DiscordOAuth2Guard)
  async getUser(@Param("id") id: string): Promise<GetUserOutputDto> {
    const user = await this.discordUsersService.getUserById(id);

    return {
      result: {
        id: user.id,
        username: user.username,
        avatarUrl: user.avatar,
      },
    };
  }

  @Get("bot")
  @UseGuards(DiscordOAuth2Guard)
  async getBot(): Promise<GetBotOutputDto> {
    const bot = await this.discordUsersService.getBot();

    return GetBotOutputDto.fromEntity(bot);
  }

  @Get("@me")
  @UseGuards(DiscordOAuth2Guard)
  async getMe(@DiscordAccessToken() accessToken: SessionAccessToken) {
    const user = await this.discordUsersService.getUser(
      accessToken.access_token
    );

    return {
      id: user.id,
      username: user.username,
      iconUrl: user.avatarUrl,
      supporter: user.supporter,
      maxFeeds: user.maxFeeds,
      maxUserFeeds: user.maxUserFeeds,
      maxUserFeedsComposition: user.maxUserFeedsComposition,
      allowCustomPlaceholders: user.allowCustomPlaceholders,
    };
  }

  @Get("@me/auth-status")
  async getAuthStatus(
    @Req() request: FastifyRequest,
    @Session() session: FastifyRequest["session"]
  ): Promise<GetMeAuthStatusOutputDto> {
    const accessToken = getAccessTokenFromRequest(request);

    if (!accessToken) {
      return {
        authenticated: false,
      };
    }

    try {
      await this.discordUsersService.getUser(accessToken.access_token);

      return {
        authenticated: true,
      };
    } catch (err) {
      if (
        err instanceof DiscordAPIError &&
        (err.statusCode === HttpStatus.FORBIDDEN ||
          err.statusCode === HttpStatus.UNAUTHORIZED)
      ) {
        // Access token has likely expired on Discord's end
        await session.delete();

        return {
          authenticated: false,
        };
      }

      throw err;
    }
  }

  @Patch("@me/supporter")
  @UseGuards(DiscordOAuth2Guard)
  @UseGuards(DiscordUserIsSupporterGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateSupporter(
    @DiscordAccessToken() accessToken: SessionAccessToken,
    @Body(TransformValidationPipe) input: UpdateSupporterInputDto
  ) {
    await this.discordUsersService.updateSupporter(accessToken.discord.id, {
      guildIds: input.guildIds,
    });
  }

  @Get("@me/servers")
  @UseGuards(DiscordOAuth2Guard)
  async getMyServers(
    @DiscordAccessToken() accessToken: SessionAccessToken
  ): Promise<GetMyServersOutputDto> {
    const guilds = await this.discordUsersService.getGuilds(
      accessToken.access_token
    );

    const data = guilds.map((guild) => ({
      id: guild.id,
      name: guild.name,
      iconUrl: guild.iconUrl,
      benefits: {
        maxFeeds: guild.benefits.maxFeeds,
        webhooks: guild.benefits.webhooks,
      },
    }));

    return {
      results: data,
      total: data.length,
    };
  }
}
