import { Config as configDev } from './dev/Config';
import { Config as configStage } from './stage/Config';
import { Config as configProd } from './prod/Config';
import { Urls as urlsDev } from './dev/urls';
import { Urls as urlsStage } from './stage/urls';
import { Urls as urlsProd } from './prod/urls';

const env = (process.env.ENVIRONMENT ?? 'dev') as 'dev' | 'stage' | 'prod';

export const Config = { dev: configDev, stage: configStage, prod: configProd }[env];
export const Urls = { dev: urlsDev, stage: urlsStage, prod: urlsProd }[env];
export { banReasons, questionBanReasonList, serverBanReasonList, userBanReasonList } from './banReasons';
