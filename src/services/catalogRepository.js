import { products as seedProducts } from "../data/products";

const KEY = "pratikshya_products";
const read = () => { try { const value = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(value) && value.length ? value : seedProducts.map((p,i)=>({...p,status:"PUBLISHED",published:true,sku:p.sku||`PF-${String(i+1).padStart(5,"0")}`,updatedAt:new Date().toISOString()})); } catch { return seedProducts; } };
const save = (items) => { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {} ; window.dispatchEvent(new Event("pratikshya-products-changed")); return items; };
export const catalogRepository = {
  all: read,
  find: (id) => read().find(p=>String(p.id)===String(id)),
  upsert: (product) => { const items=read(); const next={...product,updatedAt:new Date().toISOString(),status:product.status||"DRAFT",published:product.status==="PUBLISHED"}; const i=items.findIndex(p=>String(p.id)===String(product.id)); if(i<0) items.unshift({...next,id:`pf-${Date.now()}`}); else items[i]=next; return save(items); },
  updateStatus: (id,status) => save(read().map(p=>String(p.id)===String(id)?{...p,status,published:status==="PUBLISHED",updatedAt:new Date().toISOString()}:p)),
  skuTaken: (sku,id) => read().some(p=>p.sku?.toLowerCase()===sku?.toLowerCase() && String(p.id)!==String(id)),
};
export const catalogMetrics = (items) => ({total:items.length,published:items.filter(p=>p.status==="PUBLISHED").length,drafts:items.filter(p=>p.status==="DRAFT").length,featured:items.filter(p=>p.isFeatured).length,lowStock:items.filter(p=>p.stock>0&&p.stock<=5).length,out:items.filter(p=>!p.stock||p.status==="ARCHIVED").length});
export default catalogRepository;
