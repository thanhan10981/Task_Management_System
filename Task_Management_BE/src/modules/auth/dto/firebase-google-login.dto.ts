import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class FirebaseLoginDto {
  @ApiProperty({ description: 'Firebase Auth ID token' })
  @IsString()
  @IsNotEmpty()
  idToken: string;
}
