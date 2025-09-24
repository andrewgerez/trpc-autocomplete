import { z } from "zod";
import { publicProcedure, createTRPCRouter } from "../trpc";
import { TRPCError } from "@trpc/server";
import { prisma } from "~/shared/lib/prisma";

const autocompleteSchema = z.object({
  query: z
    .string()
    .min(2, "Enter at least 2 characters")
    .max(50, "Query too long")
    .regex(/^[a-zA-ZÀ-ÿ\s\-'\.]+$/, "Invalid characters"),
});

const idSchema = z.object({
  id: z.union([
    z.bigint().positive("Invalid ID"),
    z.number().int().positive("Invalid ID"),
    z
      .string()
      .regex(/^\d+$/, "Invalid ID format")
      .transform((val) => {
        const bigIntVal = BigInt(val);
        if (bigIntVal <= 0) throw new Error("Invalid ID");
        return bigIntVal;
      }),
  ]),
});

export const cityRouter = createTRPCRouter({
  autocomplete: publicProcedure
    .input(autocompleteSchema)
    .query(async ({ input }) => {
      const query = input.query.trim().toLowerCase();

      if (query.length < 2) return [];

      try {
        const results = await prisma.city.findMany({
          where: {
            OR: [
              {
                city: {
                  contains: query,
                  mode: "insensitive",
                },
              },
              {
                cityAscii: {
                  contains: query,
                  mode: "insensitive",
                },
              },
            ],
          },
          select: {
            id: true,
            city: true,
            country: true,
            adminName: true,
            population: true,
            latitude: true,
            longitude: true,
          },
          take: 10,
          orderBy: [{ population: "desc" }, { city: "asc" }],
        });

        return results;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Search failed",
          cause: error,
        });
      }
    }),

  byId: publicProcedure.input(idSchema).query(async ({ input }) => {
    try {
      const city = await prisma.city.findUnique({
        where: { id: input.id },
      });

      if (!city) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "City not found",
        });
      }

      return city;
    } catch (error) {
      if (error instanceof TRPCError) throw error;

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch city",
        cause: error,
      });
    }
  }),
});
