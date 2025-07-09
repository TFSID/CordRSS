/* eslint-disable max-len */
import { DynamicModule, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { DiscordAuthModule } from "../discord-auth/discord-auth.module";
import { SupportersModule } from "../supporters/supporters.module";
import { UserFeedFeature } from "../user-feeds/entities";
import { UserFeedsModule } from "../user-feeds/user-feeds.module";
import { UserFeedManagementInvitesController } from "./user-feed-management-invites.controller";
import { UserFeedManagementInvitesService } from "./user-feed-management-invites.service";

@Module({
  controllers: [UserFeedManagementInvitesController],
  providers: [UserFeedManagementInvitesService],
  imports: [
    MongooseModule.forFeature([UserFeedFeature]),
    UserFeedsModule.forRoot(),
    SupportersModule,
    DiscordAuthModule,
  ],
  exports: [UserFeedManagementInvitesService],
})
export class UserFeedManagementInvitesModule {
  static forRoot(): DynamicModule {
    return {
      module: UserFeedManagementInvitesModule,
    };
  }
}
