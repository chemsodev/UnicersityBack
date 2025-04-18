// src/change-request/dto/create-request.dto.ts
import { IsNotEmpty, IsString, IsUUID, IsEnum } from 'class-validator';
import { RequestStatus, RequestType } from './change-request.entity';

export class BaseCreateRequestDto {
    @IsEnum(RequestType)
    type: RequestType;

    @IsString()
    @IsNotEmpty()
    justification: string;
}

export class CreateSectionRequestDto extends BaseCreateRequestDto {
    @IsUUID()
    @IsNotEmpty()
    currentSectionId: string;

    @IsUUID()
    @IsNotEmpty()
    requestedSectionId: string;
}

export class CreateGroupeRequestDto extends BaseCreateRequestDto {
    @IsUUID()
    @IsNotEmpty()
    currentGroupeId: string;

    @IsUUID()
    @IsNotEmpty()
    requestedGroupeId: string;
}


export class UpdateRequestStatusDto {
    @IsEnum(RequestStatus)
    status: RequestStatus;
}