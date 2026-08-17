import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateSupplierDto, UpdateSupplierDto } from "./dto/manage-supplier.dto";

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}
  list() { return this.prisma.supplier.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }] }); }

  async create(input: CreateSupplierDto) {
    const code = input.code.trim().toUpperCase();
    const existing = await this.prisma.supplier.findUnique({ where: { code } });
    if (existing && existing.active) throw new ConflictException(`Supplier code ${code} already exists.`);
    const data = {
      code,
      name: input.name.trim(),
      contactName: input.contactName?.trim() || null,
      email: input.email?.trim().toLowerCase() || null,
      phone: input.phone?.trim() || null,
      address: input.address?.trim() || null,
      leadTimeDays: input.leadTimeDays,
      minimumOrderQuantity: input.minimumOrderQuantity,
    };
    if (existing) {
      // A previously deleted (soft-deleted) supplier with this code is restored
      // with the new details so the code can be reused.
      return this.prisma.supplier.update({ where: { id: existing.id }, data: { ...data, active: true } });
    }
    return this.prisma.supplier.create({ data });
  }

  async deactivate(id: string) {
    const current = await this.prisma.supplier.findUnique({ where: { id } });
    if (!current) throw new NotFoundException("Supplier not found.");
    if (!current.active) return current;
    return this.prisma.supplier.update({ where: { id }, data: { active: false } });
  }

  async update(id: string, input: UpdateSupplierDto) {
    const current = await this.prisma.supplier.findUnique({ where: { id } });
    if (!current) throw new NotFoundException("Supplier not found.");
    const code = input.code?.trim().toUpperCase();
    if (code && code !== current.code && await this.prisma.supplier.findUnique({ where: { code } })) throw new ConflictException(`Supplier code ${code} already exists.`);
    return this.prisma.supplier.update({ where: { id }, data: { ...this.data(input, code), ...(input.active !== undefined ? { active: input.active } : {}) } });
  }

  private data(input: UpdateSupplierDto, code?: string) {
    return {
      ...(code ? { code } : {}),
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.contactName !== undefined ? { contactName: input.contactName.trim() || null } : {}),
      ...(input.email !== undefined ? { email: input.email.trim().toLowerCase() || null } : {}),
      ...(input.phone !== undefined ? { phone: input.phone.trim() || null } : {}),
      ...(input.address !== undefined ? { address: input.address.trim() || null } : {}),
      ...(input.leadTimeDays !== undefined ? { leadTimeDays: input.leadTimeDays } : {}),
      ...(input.minimumOrderQuantity !== undefined ? { minimumOrderQuantity: input.minimumOrderQuantity } : {}),
    };
  }
}
