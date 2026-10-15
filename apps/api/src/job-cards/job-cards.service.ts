import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobCard } from './entities/job-card.entity';
import { JobCardPart } from './entities/job-card-part.entity';
import { JobCardLabor } from './entities/job-card-labor.entity';
import { InventoryPart } from './entities/inventory-part.entity';
import { LaborCatalog } from './entities/labor-catalog.entity';
import { JobCardLog } from './entities/job-card-log.entity';
import { VehicleInspection } from './entities/vehicle-inspection.entity';
import { JobCardHandover } from './entities/job-card-handover.entity';

@Injectable()
export class JobCardsService implements OnModuleInit {
  constructor(
    @InjectRepository(JobCard)
    private jobCardRepo: Repository<JobCard>,
    @InjectRepository(JobCardPart)
    private partRepo: Repository<JobCardPart>,
    @InjectRepository(JobCardLabor)
    private laborRepo: Repository<JobCardLabor>,
    @InjectRepository(InventoryPart)
    private inventoryRepo: Repository<InventoryPart>,
    @InjectRepository(LaborCatalog)
    private laborCatalogRepo: Repository<LaborCatalog>,
    @InjectRepository(JobCardLog)
    private logRepo: Repository<JobCardLog>,
    @InjectRepository(VehicleInspection)
    private inspectionRepo: Repository<VehicleInspection>,
    @InjectRepository(JobCardHandover)
    private handoverRepo: Repository<JobCardHandover>,
  ) {}

  async onModuleInit() {
    await this.seedDefaultCatalog();
  }

  private async seedDefaultCatalog() {
    const tenantId = '11111111-1111-1111-1111-111111111111';
    
    // Seed Inventory Parts if empty
    const partCount = await this.inventoryRepo.count();
    if (partCount === 0) {
      const defaultParts = [
        { partNumber: 'OIL-5W30', name: 'Engine Oil 5W-30 (Synthetic)', category: 'Oils & Fluids', stockQuantity: 50, unitCost: 40, unitPrice: 75, location: 'Rack A-1' },
        { partNumber: 'FLT-OIL-01', name: 'Engine Oil Filter', category: 'Filters', stockQuantity: 30, unitCost: 15, unitPrice: 35, location: 'Rack A-2' },
        { partNumber: 'FLT-AIR-02', name: 'Engine Air Filter', category: 'Filters', stockQuantity: 25, unitCost: 20, unitPrice: 45, location: 'Rack A-3' },
        { partNumber: 'BRK-PAD-F', name: 'Front Brake Pads Set', category: 'Brakes', stockQuantity: 15, unitCost: 110, unitPrice: 195, location: 'Rack B-1' },
        { partNumber: 'BRK-PAD-R', name: 'Rear Brake Pads Set', category: 'Brakes', stockQuantity: 12, unitCost: 95, unitPrice: 175, location: 'Rack B-2' },
        { partNumber: 'SPK-PLG-IR', name: 'Iridium Spark Plugs (Set of 4)', category: 'Engine', stockQuantity: 20, unitCost: 80, unitPrice: 150, location: 'Rack C-1' },
        { partNumber: 'ACG-R134A', name: 'AC Gas Refill R134a (Can)', category: 'Electrical', stockQuantity: 40, unitCost: 30, unitPrice: 70, location: 'Rack D-1' },
        { partNumber: 'PNT-CLR-5L', name: 'High Gloss Clear Coat Paint (1L)', category: 'Body Work', stockQuantity: 10, unitCost: 90, unitPrice: 160, location: 'Rack E-1' },
      ];
      for (const p of defaultParts) {
        await this.inventoryRepo.save(this.inventoryRepo.create({ ...p, tenantId }));
      }
    }

    // Seed Labor Catalog if empty
    const laborCount = await this.laborCatalogRepo.count();
    if (laborCount === 0) {
      const defaultLabor = [
        { name: 'Standard Oil & Filter Service', section: 'Mechanical', standardHours: 0.5, standardRate: 60 },
        { name: 'Front Brake Replacement & Turning', section: 'Mechanical', standardHours: 1.5, standardRate: 150 },
        { name: 'AC Inspection & Gas Top-up', section: 'Electrical', standardHours: 1.0, standardRate: 100 },
        { name: 'Computer Diagnostics & Scan', section: 'Electrical', standardHours: 0.5, standardRate: 80 },
        { name: 'Panel Dent Repair', section: 'Denting', standardHours: 2.0, standardRate: 200 },
        { name: 'Full Panel Paint & Bake', section: 'Painting', standardHours: 3.0, standardRate: 350 },
        { name: 'Window Tinting (Ceramic)', section: 'Tinting', standardHours: 2.0, standardRate: 250 },
        { name: 'Full Exterior Wash & Polish', section: 'Floor Cleaning', standardHours: 1.0, standardRate: 70 },
      ];
      for (const l of defaultLabor) {
        await this.laborCatalogRepo.save(this.laborCatalogRepo.create({ ...l, tenantId }));
      }
    }
  }

  async findAll() {
    const cards = await this.jobCardRepo.find({
      relations: { assignedMechanic: true },
      order: { createdAt: 'DESC' },
    });
    if (cards.length === 0) return [];

    const cardIds = cards.map(c => c.id);
    const labors = await this.laborRepo.find({
      where: cardIds.map(id => ({ jobCardId: id })),
      relations: { assignedMechanic: true },
      order: { stepOrder: 'ASC', createdAt: 'ASC' },
    });
    const parts = await this.partRepo.find({
      where: cardIds.map(id => ({ jobCardId: id })),
    });

    return cards.map(c => ({
      ...c,
      labors: labors.filter(l => l.jobCardId === c.id),
      parts: parts.filter(p => p.jobCardId === c.id),
    }));
  }

  async findOne(id: string) {
    const card = await this.jobCardRepo.findOne({
      where: { id },
      relations: { assignedMechanic: true },
    });
    if (!card) throw new NotFoundException('Job card not found');
    const parts = await this.partRepo.find({ where: { jobCardId: id } });
    const labors = await this.laborRepo.find({
      where: { jobCardId: id },
      relations: { assignedMechanic: true, qaVerifiedBy: true },
      order: { stepOrder: 'ASC', createdAt: 'ASC' },
    });
    const logs = await this.logRepo.find({
      where: { jobCardId: id },
      relations: { employee: true },
      order: { createdAt: 'DESC' },
    });
    const handovers = await this.handoverRepo.find({
      where: { jobCardId: id },
      relations: { handedOverBy: true, receivedBy: true },
      order: { createdAt: 'ASC' },
    });
    return { ...card, parts, labors, logs, handovers };
  }

  async create(dto: any) {
    const tenantId = '11111111-1111-1111-1111-111111111111';
    const branchId = dto.branchId || '22222222-2222-2222-2222-222222222222';
    
    // Generate Job Number
    const count = await this.jobCardRepo.count();
    const year = new Date().getFullYear();
    const jobNumber = `JC-${year}-${String(count + 1).padStart(4, '0')}`;

    const jobCard = this.jobCardRepo.create({
      ...dto,
      jobNumber,
      tenantId,
      branchId,
      status: dto.status || 'RECEIVED',
    }) as unknown as JobCard;

    const saved = await this.jobCardRepo.save(jobCard);

    // Initial Log
    await this.logRepo.save(this.logRepo.create({
      jobCardId: saved.id,
      employeeId: dto.assignedMechanicId || undefined,
      action: 'CREATED',
      note: `Job Card ${saved.jobNumber} created for vehicle ${saved.vehiclePlateNumber}`,
    }) as unknown as JobCardLog);

    return saved;
  }

  async updateStatus(id: string, body: { status: string; pauseReason?: string; employeeId?: string; note?: string }) {
    const card = await this.jobCardRepo.findOne({ where: { id } });
    if (!card) throw new NotFoundException('Job Card not found');

    const oldStatus = card.status;
    card.status = body.status;
    if (body.pauseReason !== undefined) card.pauseReason = body.pauseReason;
    if (body.status === 'IN_PROGRESS' && !card.startedAt) card.startedAt = new Date();
    if (body.status === 'COMPLETED' || body.status === 'READY') card.completedAt = new Date();

    const saved = await this.jobCardRepo.save(card);

    await this.logRepo.save(this.logRepo.create({
      jobCardId: id,
      employeeId: body.employeeId || undefined,
      action: `STATUS_${body.status}`,
      reason: body.pauseReason || undefined,
      note: body.note || `Status changed from ${oldStatus} to ${body.status}`,
    }) as unknown as JobCardLog);

    return saved;
  }

  async updateNotes(id: string, notes: string, advisorName?: string) {
    const card = await this.jobCardRepo.findOne({ where: { id } });
    if (!card) throw new NotFoundException('Job Card not found');

    card.notes = notes;
    const saved = await this.jobCardRepo.save(card);

    await this.logRepo.save(this.logRepo.create({
      jobCardId: id,
      action: 'ADVISOR_REMARKS_UPDATED',
      note: `Advisor Remarks updated by ${advisorName || 'Admin'}: "${notes}"`,
    }) as unknown as JobCardLog);

    return saved;
  }

  // --- VEHICLE INSPECTION & AUTO CONVERSION METHODS --- //

  async createInspection(dto: any) {
    const tenantId = '11111111-1111-1111-1111-111111111111';
    const branchId = '22222222-2222-2222-2222-222222222222';

    const count = await this.inspectionRepo.count();
    const year = new Date().getFullYear();
    const inspectionNumber = `RPT-${year}-${String(count + 1).padStart(4, '0')}`;

    const inspection = this.inspectionRepo.create({
      ...dto,
      inspectionNumber,
      tenantId,
      branchId,
      status: dto.status || 'SIGNED',
    }) as unknown as VehicleInspection;

    return this.inspectionRepo.save(inspection);
  }

  async findAllInspections() {
    return this.inspectionRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findInspection(id: string) {
    const inspection = await this.inspectionRepo.findOne({ where: { id } });
    if (!inspection) throw new NotFoundException('Inspection report not found');
    return inspection;
  }

  // AUTO CONVERT INSPECTION TO JOB CARD
  async convertInspectionToJobCard(inspectionId: string, assignedMechanicId?: string, assignedSection?: string) {
    const inspection = await this.findInspection(inspectionId);
    if (inspection.convertedJobCardId) {
      return this.findOne(inspection.convertedJobCardId);
    }

    // Build Complaints Array from Inspection extra faults & warning lights
    const complaints: string[] = [
      ...(inspection.extraFaults || []),
      ...(inspection.warningLights?.map(w => `Warning Light: ${w}`) || []),
    ];
    if (complaints.length === 0) complaints.push('General Vehicle Service');

    // Create the Job Card automatically
    const jobCard = await this.create({
      customerName: inspection.customerName,
      customerPhone: inspection.customerPhone,
      vehiclePlateNumber: inspection.vehiclePlateNumber,
      vehicleMake: inspection.vehicleMake,
      vehicleModel: inspection.vehicleModel,
      vehicleYear: inspection.vehicleYear,
      mileage: inspection.mileage,
      fuelLevel: inspection.fuelLevel,
      complaints,
      assignedSection: assignedSection || 'Mechanical',
      assignedMechanicId: assignedMechanicId || null,
      notes: `Auto-converted from Inspection Certificate #${inspection.inspectionNumber}. Damaged Markers: ${inspection.damageMarkers?.length || 0}. Valuables Checked: ${inspection.valuablesChecklist?.join(', ') || 'None'}.`,
    });

    // Auto-add labor operations based on extra faults noticed
    if (inspection.extraFaults && inspection.extraFaults.length > 0) {
      for (const fault of inspection.extraFaults) {
        await this.addLabor(jobCard.id, {
          operationName: fault,
          section: assignedSection || 'Mechanical',
          estimatedHours: 1,
          hourlyRate: 100,
        });
      }
    }

    // Update Inspection Status to CONVERTED
    inspection.status = 'CONVERTED_TO_JOBCARD';
    inspection.convertedJobCardId = jobCard.id;
    await this.inspectionRepo.save(inspection);

    return this.findOne(jobCard.id);
  }

  async addPart(jobCardId: string, partDto: any) {
    const card = await this.jobCardRepo.findOne({ where: { id: jobCardId } });
    if (!card) throw new NotFoundException('Job Card not found');

    const isVendor = !!partDto.isVendorPurchase;
    const part = this.partRepo.create({
      jobCardId,
      partNumber: partDto.partNumber || (isVendor ? 'VENDOR' : 'GENERIC'),
      partName: partDto.partName,
      quantity: partDto.quantity || 1,
      unitPrice: partDto.unitPrice || 0,
      totalPrice: (partDto.quantity || 1) * (partDto.unitPrice || 0),
      isVendorPurchase: isVendor,
      vendorName: partDto.vendorName || null,
      vendorInvoiceNumber: partDto.vendorInvoiceNumber || null,
      purchaseCost: partDto.purchaseCost || 0,
      requestedById: partDto.requestedById || null,
      status: partDto.status || 'ISSUED',
    });

    const savedPart = await this.partRepo.save(part);
    await this.recalculateTotals(jobCardId);

    const logNote = isVendor
      ? `Added Vendor Purchased Part: ${savedPart.partName} from "${savedPart.vendorName || 'Vendor'}" (Bill #${savedPart.vendorInvoiceNumber || 'N/A'}, Cost: ${savedPart.purchaseCost} AED, Price: ${savedPart.unitPrice} AED)`
      : `Added part: ${savedPart.partName} (Qty: ${savedPart.quantity})`;

    await this.logRepo.save(this.logRepo.create({
      jobCardId,
      employeeId: partDto.requestedById || undefined,
      action: isVendor ? 'VENDOR_PART_PURCHASED' : 'PART_ADDED',
      note: logNote,
    }) as unknown as JobCardLog);

    return savedPart;
  }

  async removePart(partId: string) {
    const part = await this.partRepo.findOne({ where: { id: partId } });
    if (!part) return;
    const jobCardId = part.jobCardId;
    await this.partRepo.remove(part);
    await this.recalculateTotals(jobCardId);
  }

  async addLabor(jobCardId: string, laborDto: any) {
    const card = await this.jobCardRepo.findOne({ where: { id: jobCardId } });
    if (!card) throw new NotFoundException('Job Card not found');

    const currentCount = await this.laborRepo.count({ where: { jobCardId } });
    const stepOrder = laborDto.stepOrder || (currentCount + 1);

    const labor = this.laborRepo.create({
      jobCardId,
      operationName: laborDto.operationName || 'General Operation',
      section: laborDto.section || 'General',
      assignedMechanicId: laborDto.assignedMechanicId || null,
      estimatedHours: Number(laborDto.estimatedHours) || 1,
      actualHours: Number(laborDto.actualHours) || 0,
      hourlyRate: Number(laborDto.hourlyRate) || 0,
      totalPrice: (Number(laborDto.estimatedHours) || 1) * (Number(laborDto.hourlyRate) || 0),
      stepOrder,
      status: laborDto.status || (laborDto.assignedMechanicId ? 'IN_PROGRESS' : 'PENDING'),
      startedAt: laborDto.assignedMechanicId ? new Date() : null,
    });

    const savedLabor = await this.laborRepo.save(labor);
    await this.recalculateTotals(jobCardId);

    if (savedLabor.assignedMechanicId && (!card.assignedMechanicId || card.status === 'PENDING' || card.status === 'RECEIVED')) {
      card.assignedMechanicId = savedLabor.assignedMechanicId;
      card.assignedSection = savedLabor.section;
      card.status = 'IN_PROGRESS';
      await this.jobCardRepo.save(card);
    }

    await this.logRepo.save(this.logRepo.create({
      jobCardId,
      employeeId: savedLabor.assignedMechanicId || undefined,
      action: 'LABOR_ADDED',
      note: `Added job task: "${savedLabor.operationName}" (${savedLabor.section}, Step #${stepOrder})`,
    }) as unknown as JobCardLog);

    return savedLabor;
  }

  async updateLabor(laborId: string, updateDto: any) {
    const labor = await this.laborRepo.findOne({ where: { id: laborId } });
    if (!labor) throw new NotFoundException('Labor task not found');

    if (updateDto.operationName !== undefined) labor.operationName = updateDto.operationName;
    if (updateDto.section !== undefined) labor.section = updateDto.section;
    if (updateDto.assignedMechanicId !== undefined) {
      labor.assignedMechanicId = updateDto.assignedMechanicId || null;
      if (updateDto.assignedMechanicId && (labor.status === 'PENDING' || labor.status === 'UNASSIGNED')) {
        labor.status = 'IN_PROGRESS';
        if (!labor.startedAt) labor.startedAt = new Date();
      }
    }
    if (updateDto.estimatedHours !== undefined) labor.estimatedHours = Number(updateDto.estimatedHours) || 1;
    if (updateDto.hourlyRate !== undefined) labor.hourlyRate = Number(updateDto.hourlyRate) || 0;
    labor.totalPrice = (labor.estimatedHours || 1) * (labor.hourlyRate || 0);
    if (updateDto.status !== undefined) labor.status = updateDto.status;
    if (updateDto.stepOrder !== undefined) labor.stepOrder = Number(updateDto.stepOrder) || labor.stepOrder;

    const saved = await this.laborRepo.save(labor);
    await this.recalculateTotals(labor.jobCardId);

    if (updateDto.assignedMechanicId) {
      const card = await this.jobCardRepo.findOne({ where: { id: labor.jobCardId } });
      if (card && (!card.assignedMechanicId || card.status === 'RECEIVED' || card.status === 'PENDING')) {
        card.assignedMechanicId = updateDto.assignedMechanicId;
        card.assignedSection = labor.section;
        card.status = 'IN_PROGRESS';
        await this.jobCardRepo.save(card);
      }
    }

    await this.logRepo.save(this.logRepo.create({
      jobCardId: labor.jobCardId,
      employeeId: labor.assignedMechanicId || undefined,
      action: 'LABOR_UPDATED',
      note: `Updated job task "${labor.operationName}" (${labor.section})`,
    }) as unknown as JobCardLog);

    return saved;
  }

  async removeLabor(laborId: string) {
    const labor = await this.laborRepo.findOne({ where: { id: laborId } });
    if (!labor) return;
    const jobCardId = labor.jobCardId;
    await this.laborRepo.remove(labor);
    await this.recalculateTotals(jobCardId);
  }

  async recalculateTotals(jobCardId: string) {
    const parts = await this.partRepo.find({ where: { jobCardId } });
    const labors = await this.laborRepo.find({ where: { jobCardId } });

    const partsTotal = parts.reduce((sum, p) => sum + (p.totalPrice || 0), 0);
    const laborTotal = labors.reduce((sum, l) => sum + (l.totalPrice || 0), 0);
    const subtotal = partsTotal + laborTotal;
    const taxAmount = subtotal * 0.05; // 5% VAT default
    const grandTotal = subtotal + taxAmount;

    await this.jobCardRepo.update(jobCardId, {
      partsTotal,
      laborTotal,
      taxAmount,
      grandTotal,
    });
  }

  async getMechanicJobs(employeeId: string) {
    return this.jobCardRepo.find({
      where: { assignedMechanicId: employeeId },
      order: { updatedAt: 'DESC' },
    });
  }

  async getInventoryParts() {
    return this.inventoryRepo.find({ order: { name: 'ASC' } });
  }

  async createInventoryPart(dto: any) {
    const tenantId = '11111111-1111-1111-1111-111111111111';
    const part = this.inventoryRepo.create({
      tenantId,
      partNumber: dto.partNumber,
      name: dto.name,
      category: dto.category || 'General',
      stockQuantity: Number(dto.stockQuantity) || 0,
      unitPrice: Number(dto.unitPrice) || 0,
      unitCost: Number(dto.unitCost) || 0,
      location: dto.location || 'Shelf A',
    });
    return this.inventoryRepo.save(part);
  }

  async updateInventoryPart(id: string, dto: any) {
    const part = await this.inventoryRepo.findOne({ where: { id } });
    if (!part) throw new NotFoundException('Inventory part not found');
    if (dto.partNumber !== undefined) part.partNumber = dto.partNumber;
    if (dto.name !== undefined) part.name = dto.name;
    if (dto.category !== undefined) part.category = dto.category;
    if (dto.stockQuantity !== undefined) part.stockQuantity = Number(dto.stockQuantity);
    if (dto.unitPrice !== undefined) part.unitPrice = Number(dto.unitPrice);
    if (dto.unitCost !== undefined) part.unitCost = Number(dto.unitCost);
    if (dto.location !== undefined) part.location = dto.location;
    return this.inventoryRepo.save(part);
  }

  async deleteInventoryPart(id: string) {
    const part = await this.inventoryRepo.findOne({ where: { id } });
    if (!part) throw new NotFoundException('Inventory part not found');
    await this.inventoryRepo.remove(part);
    return { success: true, message: 'Part deleted successfully' };
  }

  async getLaborCatalog() {
    return this.laborCatalogRepo.find({ order: { name: 'ASC' } });
  }

  async createLaborCatalog(dto: any) {
    const tenantId = '11111111-1111-1111-1111-111111111111';
    const labor = this.laborCatalogRepo.create({
      tenantId,
      name: dto.name,
      section: dto.section || 'Mechanical',
      standardHours: Number(dto.standardHours) || 1,
      standardRate: Number(dto.standardRate) || 100,
    });
    return this.laborCatalogRepo.save(labor);
  }

  async updateLaborCatalog(id: string, dto: any) {
    const labor = await this.laborCatalogRepo.findOne({ where: { id } });
    if (!labor) throw new NotFoundException('Labor operation not found');
    if (dto.name !== undefined) labor.name = dto.name;
    if (dto.section !== undefined) labor.section = dto.section;
    if (dto.standardHours !== undefined) labor.standardHours = Number(dto.standardHours);
    if (dto.standardRate !== undefined) labor.standardRate = Number(dto.standardRate);
    return this.laborCatalogRepo.save(labor);
  }

  async deleteLaborCatalog(id: string) {
    const labor = await this.laborCatalogRepo.findOne({ where: { id } });
    if (!labor) throw new NotFoundException('Labor operation not found');
    await this.laborCatalogRepo.remove(labor);
    return { success: true, message: 'Labor operation deleted successfully' };
  }

  async deleteJobCard(id: string) {
    const card = await this.jobCardRepo.findOne({ where: { id } });
    if (!card) throw new NotFoundException('Job Card not found');
    await this.partRepo.delete({ jobCardId: id });
    await this.laborRepo.delete({ jobCardId: id });
    await this.logRepo.delete({ jobCardId: id });
    await this.handoverRepo.delete({ jobCardId: id });
    await this.jobCardRepo.remove(card);
    return { success: true, message: `Job Card ${card.jobNumber} was deleted successfully.` };
  }

  async deleteInspection(id: string) {
    const insp = await this.inspectionRepo.findOne({ where: { id } });
    if (!insp) throw new NotFoundException('Inspection certificate not found');
    await this.inspectionRepo.remove(insp);
    return { success: true, message: 'Inspection certificate deleted successfully' };
  }

  // --- ERP SYNC & MULTI-DEPARTMENT WORKFLOW METHODS --- //

  async syncErpJobCard(dto: any) {
    const tenantId = '11111111-1111-1111-1111-111111111111';
    const branchId = dto.branchId || '22222222-2222-2222-2222-222222222222';

    const rawJobId = (dto.externalErpId || dto.jobNumber || '').trim();
    const count = await this.jobCardRepo.count();
    const year = new Date().getFullYear();
    const jobNumber = rawJobId
      ? (rawJobId.toUpperCase().startsWith('ERP-') || rawJobId.toUpperCase().startsWith('JC-') ? rawJobId.toUpperCase() : `ERP-${rawJobId.toUpperCase()}`)
      : `JC-${year}-${String(count + 1).padStart(4, '0')}`;

    let savedCard = await this.jobCardRepo.findOne({ where: { jobNumber } });
    if (!savedCard) {
      const jobCard = this.jobCardRepo.create({
        customerName: dto.customerName || 'ERP Job',
        customerPhone: dto.customerPhone || 'N/A',
        vehiclePlateNumber: dto.vehiclePlateNumber || 'N/A',
        vehicleMake: dto.vehicleMake || 'General',
        vehicleModel: dto.vehicleModel || 'Vehicle',
        vehicleYear: dto.vehicleYear || null,
        vin: dto.vin || null,
        mileage: dto.mileage || 0,
        fuelLevel: dto.fuelLevel || 'half',
        complaints: dto.complaints || [],
        priority: dto.priority || 'NORMAL',
        notes: dto.notes || 'Created / Synced Job Card',
        externalErpId: rawJobId || null,
        externalErpStatus: dto.externalErpStatus || 'SYNCED_MANUAL',
        isSyncedFromErp: true,
        jobNumber,
        tenantId,
        branchId,
        status: 'IN_PROGRESS',
        assignedSection: dto.tasks && dto.tasks.length > 0 ? dto.tasks[0].section : 'General',
        assignedMechanicId: dto.tasks && dto.tasks.length > 0 ? (dto.tasks[0].assignedMechanicId || null) : null,
        startedAt: new Date(),
      }) as unknown as JobCard;

      savedCard = await this.jobCardRepo.save(jobCard);
    } else {
      if (dto.vehiclePlateNumber) savedCard.vehiclePlateNumber = dto.vehiclePlateNumber;
      if (dto.vehicleModel) savedCard.vehicleModel = dto.vehicleModel;
      if (dto.vehicleMake) savedCard.vehicleMake = dto.vehicleMake;
      savedCard = await this.jobCardRepo.save(savedCard);
    }

    // Save Labor Operations with step ordering
    if (dto.tasks && Array.isArray(dto.tasks)) {
      for (let i = 0; i < dto.tasks.length; i++) {
        const task = dto.tasks[i];
        const labor = this.laborRepo.create({
          jobCardId: savedCard.id,
          operationName: task.operationName || task.name || `Task ${i + 1}`,
          section: task.section || 'General',
          stepOrder: task.stepOrder || i + 1,
          assignedMechanicId: task.assignedMechanicId || null,
          estimatedHours: task.estimatedHours || 1,
          hourlyRate: task.hourlyRate || 0,
          totalPrice: (task.estimatedHours || 1) * (task.hourlyRate || 0),
          status: i === 0 ? 'IN_PROGRESS' : 'PENDING',
          startedAt: i === 0 ? new Date() : null,
        });
        await this.laborRepo.save(labor);
      }
    }

    // Save Parts if provided from ERP
    if (dto.parts && Array.isArray(dto.parts)) {
      for (const p of dto.parts) {
        const part = this.partRepo.create({
          jobCardId: savedCard.id,
          partNumber: p.partNumber || 'ERP-PART',
          partName: p.partName || p.name,
          quantity: p.quantity || 1,
          unitPrice: p.unitPrice || 0,
          totalPrice: (p.quantity || 1) * (p.unitPrice || 0),
          isVendorPurchase: !!p.isVendorPurchase,
          vendorName: p.vendorName || null,
          vendorInvoiceNumber: p.vendorInvoiceNumber || null,
          purchaseCost: p.purchaseCost || 0,
          status: 'ISSUED',
        });
        await this.partRepo.save(part);
      }
    }

    await this.recalculateTotals(savedCard.id);

    await this.logRepo.save(this.logRepo.create({
      jobCardId: savedCard.id,
      action: 'ERP_JOB_CARD_SYNCED',
      note: `Job Card synced from External ERP Ref #${dto.externalErpId || savedCard.jobNumber} with ${dto.tasks?.length || 0} ordered tasks across departments.`,
    }) as unknown as JobCardLog);

    return this.findOne(savedCard.id);
  }

  async updateLaborStatus(laborId: string, body: { status: string; pauseReason?: string; employeeId?: string; actualMinutes?: number; note?: string }) {
    const labor = await this.laborRepo.findOne({ where: { id: laborId } });
    if (!labor) throw new NotFoundException('Labor task not found');

    const oldStatus = labor.status;
    labor.status = body.status;

    if (body.pauseReason !== undefined) labor.pauseReason = body.pauseReason;
    if (body.actualMinutes) labor.actualMinutes = (labor.actualMinutes || 0) + body.actualMinutes;
    if (body.status === 'IN_PROGRESS' && !labor.startedAt) labor.startedAt = new Date();
    if (body.status === 'QA_PENDING' || body.status === 'COMPLETED') labor.completedAt = new Date();

    const savedLabor = await this.laborRepo.save(labor);

    // Also update parent Job Card status to match floor activity
    const card = await this.jobCardRepo.findOne({ where: { id: labor.jobCardId } });
    if (card) {
      if (body.status === 'PAUSED') {
        card.status = 'PAUSED';
        card.pauseReason = body.pauseReason || 'TASK_PAUSED';
      } else if (body.status === 'IN_PROGRESS') {
        card.status = 'IN_PROGRESS';
        card.pauseReason = null;
        card.assignedSection = labor.section;
        if (labor.assignedMechanicId) card.assignedMechanicId = labor.assignedMechanicId;
      } else if (body.status === 'QA_PENDING') {
        card.status = 'QUALITY_CHECK';
      }
      await this.jobCardRepo.save(card);
    }

    await this.logRepo.save(this.logRepo.create({
      jobCardId: labor.jobCardId,
      employeeId: body.employeeId || labor.assignedMechanicId || undefined,
      action: `LABOR_STATUS_${body.status}`,
      reason: body.pauseReason || undefined,
      note: body.note || `Task "${labor.operationName}" (${labor.section}) status changed from ${oldStatus} to ${body.status}`,
    }) as unknown as JobCardLog);

    return savedLabor;
  }

  async verifyTaskQa(laborId: string, body: { qaPassed: boolean; qaNotes?: string; qaVerifiedById?: string }) {
    const labor = await this.laborRepo.findOne({ where: { id: laborId } });
    if (!labor) throw new NotFoundException('Labor task not found');

    labor.qaPassed = body.qaPassed;
    labor.qaNotes = body.qaNotes || null;
    labor.qaVerifiedById = body.qaVerifiedById || null;
    labor.qaVerifiedAt = new Date();

    if (body.qaPassed) {
      labor.status = 'COMPLETED';

      // Check if there is a next task in sequence for handover
      const nextLabor = await this.laborRepo.findOne({
        where: { jobCardId: labor.jobCardId, stepOrder: labor.stepOrder + 1 },
      });

      if (nextLabor) {
        nextLabor.status = 'HANDOVER_PENDING';
        await this.laborRepo.save(nextLabor);
      } else {
        // Check if all tasks in job card are completed
        const allLabors = await this.laborRepo.find({ where: { jobCardId: labor.jobCardId } });
        const allDone = allLabors.every(l => l.id === labor.id || l.status === 'COMPLETED');
        if (allDone) {
          const card = await this.jobCardRepo.findOne({ where: { id: labor.jobCardId } });
          if (card) {
            card.status = 'READY';
            card.completedAt = new Date();
            await this.jobCardRepo.save(card);
          }
        }
      }
    } else {
      labor.status = 'REWORK_NEEDED';
      const card = await this.jobCardRepo.findOne({ where: { id: labor.jobCardId } });
      if (card) {
        card.status = 'IN_PROGRESS';
        card.pauseReason = 'REWORK_REQUIRED';
        await this.jobCardRepo.save(card);
      }
    }

    const saved = await this.laborRepo.save(labor);

    await this.logRepo.save(this.logRepo.create({
      jobCardId: labor.jobCardId,
      employeeId: body.qaVerifiedById || undefined,
      action: body.qaPassed ? 'QA_PASSED' : 'QA_REJECTED',
      note: body.qaPassed
        ? `QA Verified & Approved Task "${labor.operationName}". Notes: "${body.qaNotes || 'All checks passed'}"`
        : `QA Flagged Rework for Task "${labor.operationName}". Reason: "${body.qaNotes || 'Requires adjustment'}"`,
    }) as unknown as JobCardLog);

    return saved;
  }

  async submitHandoverQwc(jobCardId: string, body: any) {
    const card = await this.jobCardRepo.findOne({ where: { id: jobCardId } });
    if (!card) throw new NotFoundException('Job Card not found');

    const handover = this.handoverRepo.create({
      jobCardId,
      fromSection: body.fromSection,
      toSection: body.toSection,
      fromLaborId: body.fromLaborId || null,
      toLaborId: body.toLaborId || null,
      handedOverById: body.handedOverById || null,
      receivedById: body.receivedById || null,
      checklist: body.checklist || [
        { item: 'No new vehicle body scratches or dents created', passed: true },
        { item: 'All tools & parts cleared from current section', passed: true },
        { item: 'Vehicle dashboard / warning lights inspected', passed: true },
        { item: 'Interior cleanliness maintained', passed: true },
      ],
      status: body.status || 'PASSED',
      notes: body.notes || 'Inter-department QWC handover completed successfully.',
    });

    const savedHandover = await this.handoverRepo.save(handover);

    // Activate the receiving task
    if (body.toLaborId) {
      const receivingLabor = await this.laborRepo.findOne({ where: { id: body.toLaborId } });
      if (receivingLabor) {
        receivingLabor.status = 'IN_PROGRESS';
        receivingLabor.startedAt = new Date();
        if (body.receivedById) receivingLabor.assignedMechanicId = body.receivedById;
        await this.laborRepo.save(receivingLabor);

        // Update JobCard section & mechanic
        card.assignedSection = receivingLabor.section;
        if (receivingLabor.assignedMechanicId) card.assignedMechanicId = receivingLabor.assignedMechanicId;
        card.status = 'IN_PROGRESS';
        card.pauseReason = null;
        await this.jobCardRepo.save(card);
      }
    }

    await this.logRepo.save(this.logRepo.create({
      jobCardId,
      employeeId: body.handedOverById || body.receivedById || undefined,
      action: 'QWC_HANDOVER_VERIFIED',
      note: `Inter-Department Handover QWC verified from [${body.fromSection}] to [${body.toSection}]. Verified undamaged & clear to proceed.`,
    }) as unknown as JobCardLog);

    return savedHandover;
  }

  async reopenJobCard(jobCardId: string, body: { reopenReason: string; employeeId?: string }) {
    const card = await this.jobCardRepo.findOne({ where: { id: jobCardId } });
    if (!card) throw new NotFoundException('Job Card not found');

    card.status = 'IN_PROGRESS';
    card.isRework = true;
    card.reopenReason = body.reopenReason;
    card.reopenedAt = new Date();
    card.completedAt = null;

    const saved = await this.jobCardRepo.save(card);

    await this.logRepo.save(this.logRepo.create({
      jobCardId,
      employeeId: body.employeeId || undefined,
      action: 'JOB_CARD_REOPENED',
      reason: 'REWORK_CUSTOMER_RETURN',
      note: `Job Card reopened for rework by Admin/Advisor. Reason: "${body.reopenReason}"`,
    }) as unknown as JobCardLog);

    return saved;
  }

  async assignLabor(laborId: string, employeeId: string) {
    const labor = await this.laborRepo.findOne({ where: { id: laborId } });
    if (!labor) throw new NotFoundException('Labor task not found');

    labor.assignedMechanicId = employeeId;
    if (labor.status === 'PENDING' || labor.status === 'FREE' || labor.status === 'UNASSIGNED') {
      labor.status = 'IN_PROGRESS';
      labor.startedAt = new Date();
    }
    const saved = await this.laborRepo.save(labor);

    const card = await this.jobCardRepo.findOne({ where: { id: labor.jobCardId } });
    if (card) {
      card.assignedMechanicId = employeeId;
      card.assignedSection = labor.section;
      if (card.status === 'PENDING') {
        card.status = 'IN_PROGRESS';
      }
      await this.jobCardRepo.save(card);
    }

    await this.logRepo.save(this.logRepo.create({
      jobCardId: labor.jobCardId,
      employeeId,
      action: 'LABOR_ASSIGNED',
      note: `Task "${labor.operationName}" (${labor.section}) assigned to technician ID ${employeeId}`,
    }) as unknown as JobCardLog);

    return saved;
  }
}

