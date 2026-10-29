import { Slider as SliderPrimitive } from "@base-ui/react/slider";
import { cn } from "cn";

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: SliderPrimitive.Root.Props) {
  const fallbackValues = Array.isArray(defaultValue)
    ? defaultValue
    : [min, max];
  const _values = Array.isArray(value) ? value : fallbackValues;

  return (
    <SliderPrimitive.Root
      className={cn("data-horizontal:w-full data-vertical:h-full", className)}
      data-slot="slider"
      defaultValue={defaultValue}
      max={max}
      min={min}
      thumbAlignment="edge"
      value={value}
      {...props}
    >
      <SliderPrimitive.Control className="relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col">
        <SliderPrimitive.Track
          className="bg-muted relative grow overflow-hidden rounded-4xl select-none data-horizontal:h-3 data-horizontal:w-full data-vertical:h-full data-vertical:w-3"
          data-slot="slider-track"
        >
          <SliderPrimitive.Indicator
            className="bg-primary select-none data-horizontal:h-full data-vertical:w-full"
            data-slot="slider-range"
          />
        </SliderPrimitive.Track>
        {Array.from({ length: _values.length }, (_, index) => (
          <SliderPrimitive.Thumb
            className="border-primary ring-ring/50 block size-4 shrink-0 rounded-4xl border bg-white shadow-sm transition-colors select-none hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
            data-slot="slider-thumb"
            getAriaLabel={
              props["aria-label"]
                ? () => props["aria-label"] as string
                : undefined
            }
            // biome-ignore lint/suspicious/noArrayIndexKey: thumbs are positional and never reorder
            key={index}
          />
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}

export { Slider };
