import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Registered email', example: 'hanhan3316@gmail.com' })
  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({ description: '6-digit verification code sent to email', example: '123456' })
  @IsString()
  @IsNotEmpty({ message: 'Verification code is required' })
  verificationCode: string;

  @ApiProperty({ description: 'New password', minLength: 6, example: 'newStrongPass123' })
  @IsString()
  @IsNotEmpty({ message: 'New password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  newPassword: string;

  @ApiProperty({ description: 'Confirm new password', minLength: 6, example: 'newStrongPass123' })
  @IsString()
  @IsNotEmpty({ message: 'Confirm password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  confirmPassword: string;
}
