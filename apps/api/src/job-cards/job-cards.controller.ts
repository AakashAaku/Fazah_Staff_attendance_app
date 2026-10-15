import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { JobCardsService } from './job-cards.service';

@Controller('job-cards')
export class JobCardsController {
  constructor(private readonly service: JobCardsService) {}

  @Get()
  async findAll() {
    return this.service.findAll();
  }

  @Get('inventory-parts')
  async getInventoryParts() {
    return this.service.getInventoryParts();
  }

  @Post('inventory-parts')
  async createInventoryPart(@Body() body: any) {
    return this.service.createInventoryPart(body);
  }

  @Patch('inventory-parts/:id')
  async updateInventoryPart(@Param('id') id: string, @Body() body: any) {
    return this.service.updateInventoryPart(id, body);
  }

  @Delete('inventory-parts/:id')
  async deleteInventoryPart(@Param('id') id: string) {
    return this.service.deleteInventoryPart(id);
  }

  @Get('labor-catalog')
  async getLaborCatalog() {
    return this.service.getLaborCatalog();
  }

  @Post('labor-catalog')
  async createLaborCatalog(@Body() body: any) {
    return this.service.createLaborCatalog(body);
  }

  @Patch('labor-catalog/:id')
  async updateLaborCatalog(@Param('id') id: string, @Body() body: any) {
    return this.service.updateLaborCatalog(id, body);
  }

  @Delete('labor-catalog/:id')
  async deleteLaborCatalog(@Param('id') id: string) {
    return this.service.deleteLaborCatalog(id);
  }

  // --- INSPECTION ENDPOINTS --- //

  @Get('inspections')
  async findAllInspections() {
    return this.service.findAllInspections();
  }

  @Post('inspections')
  async createInspection(@Body() body: any) {
    return this.service.createInspection(body);
  }

  @Get('inspections/:id')
  async findInspection(@Param('id') id: string) {
    return this.service.findInspection(id);
  }

  @Delete('inspections/:id')
  async deleteInspection(@Param('id') id: string) {
    return this.service.deleteInspection(id);
  }

  @Post('inspections/:id/convert')
  async convertInspectionToJobCard(@Param('id') id: string, @Body() body: { assignedMechanicId?: string; assignedSection?: string }) {
    return this.service.convertInspectionToJobCard(id, body.assignedMechanicId, body.assignedSection);
  }

  // --- JOB CARD ENDPOINTS --- //

  @Get('mechanic/:employeeId')
  async getMechanicJobs(@Param('employeeId') employeeId: string) {
    return this.service.getMechanicJobs(employeeId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Delete(':id')
  async deleteJobCard(@Param('id') id: string) {
    return this.service.deleteJobCard(id);
  }

  @Post()
  async create(@Body() body: any) {
    return this.service.create(body);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: any) {
    return this.service.updateStatus(id, body);
  }

  @Patch(':id/notes')
  async updateNotes(@Param('id') id: string, @Body() body: { notes: string; advisorName?: string }) {
    return this.service.updateNotes(id, body.notes, body.advisorName);
  }

  @Post('sync-erp')
  async syncErpJobCard(@Body() body: any) {
    return this.service.syncErpJobCard(body);
  }

  @Patch('labors/:laborId/status')
  async updateLaborStatus(@Param('laborId') laborId: string, @Body() body: any) {
    return this.service.updateLaborStatus(laborId, body);
  }

  @Patch('labors/:laborId')
  async updateLabor(@Param('laborId') laborId: string, @Body() body: any) {
    return this.service.updateLabor(laborId, body);
  }

  @Patch('labors/:laborId/assign')
  async assignLabor(@Param('laborId') laborId: string, @Body() body: { employeeId: string }) {
    return this.service.assignLabor(laborId, body.employeeId);
  }

  @Post('labors/:laborId/qa-verify')
  async verifyTaskQa(@Param('laborId') laborId: string, @Body() body: any) {
    return this.service.verifyTaskQa(laborId, body);
  }

  @Post(':id/handover-qwc')
  async submitHandoverQwc(@Param('id') id: string, @Body() body: any) {
    return this.service.submitHandoverQwc(id, body);
  }

  @Post(':id/reopen')
  async reopenJobCard(@Param('id') id: string, @Body() body: any) {
    return this.service.reopenJobCard(id, body);
  }

  @Post(':id/parts')
  async addPart(@Param('id') id: string, @Body() body: any) {
    return this.service.addPart(id, body);
  }

  @Delete('parts/:partId')
  async removePart(@Param('partId') partId: string) {
    return this.service.removePart(partId);
  }

  @Post(':id/labors')
  async addLabor(@Param('id') id: string, @Body() body: any) {
    return this.service.addLabor(id, body);
  }

  @Delete('labors/:laborId')
  async removeLabor(@Param('laborId') laborId: string) {
    return this.service.removeLabor(laborId);
  }
}
