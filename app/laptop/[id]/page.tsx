import { Metadata } from 'next';
import { getProductoById } from '@/lib/data';
import ClientRedirect from './ClientRedirect';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const producto = await getProductoById(id);

  if (!producto) {
    return { title: 'Laptop no encontrada - EasyLaptops' };
  }

  const precio = new Intl.NumberFormat('es-PY').format(producto.precio_oferta || producto.precio);

  return {
    title: `${producto.marca} ${producto.modelo} - ${precio} Gs | EasyLaptops`,
    description: producto.descripcion || `Comprá esta ${producto.marca} al mejor precio.`,
    openGraph: {
      title: `${producto.marca} ${producto.modelo} - ${precio} Gs`,
      description: producto.descripcion,
      images: [
        {
          url: producto.imagenes && producto.imagenes.length > 0 ? producto.imagenes[0] : '',
          width: 800,
          height: 600,
          alt: `${producto.marca} ${producto.modelo}`,
        },
      ],
    },
  };
}

export default async function LaptopPage({ params }: Props) {
  const { id } = await params;
  return <ClientRedirect id={id} />;
}
