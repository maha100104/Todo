import { Controller, Get, Post, Put, Delete, Patch, Param, Body, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AddressService } from './address.service';
import { JwtAuthGuard } from '../guard/jwt-auth-guard';
import { GetUser } from '../customDecorator/getProfile';

@Controller('address')
@UseGuards(JwtAuthGuard)
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Get()
  get(@GetUser() user: any) {
    return this.addressService.getAddresses(user.id);
  }

  @Post()
  add(@GetUser() user: any, @Body() body: any) {
    return this.addressService.addAddress(user.id, body);
  }

  @Put(':id')
  update(
    @GetUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any
  ) {
    return this.addressService.updateAddress(user.id, id, body);
  }

  @Delete(':id')
  remove(@GetUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.addressService.deleteAddress(user.id, id);
  }

  @Patch(':id/default')
  setDefault(@GetUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.addressService.setDefault(user.id, id);
  }
}
