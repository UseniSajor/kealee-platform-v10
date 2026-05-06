import type { MediaVideo } from '@/components/media/types'

// Pexels stock videos — HD 1280x720 mp4 direct links
export const STOCK_VIDEOS: Record<string, MediaVideo> = {
  kitchen_remodel: {
    src: 'https://videos.pexels.com/video-files/34572332/14649228_1280_720_30fps.mp4',
    posterUrl: 'https://images.pexels.com/videos/34572332/pexels-photo-34572332.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200',
    label: 'Kitchen Remodel Walkthrough',
    duration: 6,
  },
  bathroom_remodel: {
    src: 'https://videos.pexels.com/video-files/8403602/8403602-hd_1280_720_30fps.mp4',
    posterUrl: 'https://images.pexels.com/videos/8403602/pexels-photo-8403602.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200',
    label: 'Bathroom Renovation Tour',
    duration: 12,
  },
  addition_expansion: {
    src: 'https://videos.pexels.com/video-files/17506766/17506766-hd_1280_720_24fps.mp4',
    posterUrl: 'https://images.pexels.com/videos/17506766/pexels-photo-17506766.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200',
    label: 'Home Addition Process',
    duration: 13,
  },
  whole_home_remodel: {
    src: 'https://videos.pexels.com/video-files/6474389/6474389-hd_1280_720_25fps.mp4',
    posterUrl: 'https://images.pexels.com/videos/6474389/pexels-photo-6474389.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200',
    label: 'Whole-Home Renovation',
    duration: 8,
  },
  garden_concept: {
    src: 'https://videos.pexels.com/video-files/35321731/14964924_1280_720_30fps.mp4',
    posterUrl: 'https://images.pexels.com/videos/35321731/pexels-photo-35321731.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200',
    label: 'Garden Concept Reveal',
    duration: 9,
  },
  interior_renovation: {
    src: 'https://videos.pexels.com/video-files/6474143/6474143-hd_1280_720_25fps.mp4',
    posterUrl: 'https://images.pexels.com/videos/6474143/pexels-photo-6474143.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200',
    label: 'Interior Renovation Walkthrough',
    duration: 24,
  },
  exterior_concept: {
    src: 'https://videos.pexels.com/video-files/11841270/11841270-hd_1280_720_60fps.mp4',
    posterUrl: 'https://images.pexels.com/videos/11841270/aerial-building-building-homes-canada-11841270.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200',
    label: 'Exterior Transformation',
    duration: 18,
  },
  interior_reno_concept: {
    src: 'https://videos.pexels.com/video-files/17211936/17211936-hd_1280_720_30fps.mp4',
    posterUrl: 'https://images.pexels.com/videos/17211936/4k-4k-footage-4k-resolution-active-lifestyle-17211936.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200',
    label: 'Interior Design Concept',
    duration: 3,
  },
  design_build: {
    src: 'https://videos.pexels.com/video-files/31025089/13261573_1280_720_24fps.mp4',
    posterUrl: 'https://images.pexels.com/videos/31025089/pexels-photo-31025089.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200',
    label: 'Design + Build Journey',
    duration: 32,
  },
}
